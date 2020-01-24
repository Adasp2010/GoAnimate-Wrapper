const themeFolder = process.env.THEME_FOLDER;
const char = require('../character/main');
const ttsInfo = require('../tts/info');
const caché = require('../data/caché');
const source = process.env.CLIENT_URL;
const header = process.env.XML_HEADER;
const get = require('../request/get');
const fUtil = require('../fileUtil');
const nodezip = require('node-zip');
const store = process.env.STORE_URL;
const xmldoc = require('xmldoc');
const fs = require('fs');

function useBase64(aId) {
	switch (aId.substr(aId.lastIndexOf('.') + 1)) {
		case 'xml':
			return false;
		default:
			return true;
	}
}

module.exports = {
	xml2caché(buffer) {
		const xml = new xmldoc.XmlDocument(buffer);
		const cachéRef = {}, elements = xml.children;
		for (const eK in elements) {
			var element = elements[eK];
			if (element.name == 'asset')
				cachéRef[element.attr.id] =
					Buffer.from(element.val, 'base64');
		}
		return cachéRef;
	},
	/**
	 * 
	 * @param {Buffer} buffer 
	 * @param {string} mId
	 * @returns {Promise<Buffer>}
	 */
	async packXml(buffer, mId = null) {
		const zip = nodezip.create();
		mId && caché.saveTable(mId);
		const themes = { common: true };
		var ugcString = `${header}<theme id="ugc" name="ugc">`;
		fUtil.addToZip(zip, 'movie.xml', buffer);
		const xml = new xmldoc.XmlDocument(buffer);
		const elements = xml.children;
		for (const eK in elements) {
			var element = elements[eK];
			switch (element.name) {

				case 'asset': {
					if (mId) {
						const aId = element.attr.id;
						const m = useBase64(aId) ? 'base64' : 'utf8';
						const v = Buffer.from(element.val, m);
						caché.save(mId, aId, v);
					}
					break;
				}

				case 'sound': {
					const sfile = element.childNamed('sfile').val;
					const file = sfile.substr(sfile.indexOf('.') + 1);
					var xmlStr;

					var ttsData = element.childNamed('ttsdata');
					if (ttsData) {
						var text = ttsData.childNamed('text').val;
						var voice = ttsInfo.voices[ttsData.childNamed('voice').val].desc;
						var name = `[${voice}] ${text.replace(/"/g, '\\"')}`;
						xmlStr = `subtype="tts" id="${file}" name="${name}" downloadtype="progressive"`;
					}
					else
						xmlStr = `subtype="sound" id="${file}" name="${file}" downloadtype="progressive"`;
					ugcString += `<sound ${xmlStr}/>`;
					break;
				}

				case 'scene':
					for (const pK in element.children) {
						var piece = element.children[pK];
						switch (piece.name) {
							case 'durationSetting':
							case 'trans':
								break;
							case 'bg':
							//case 'effect':
							case 'prop': {
								var val = piece.childNamed('file').val;
								var pieces = val.split('.');

								pieces.splice(1, 0, piece.name);
								var ext = pieces.pop();
								pieces[pieces.length - 1] += `.${ext}`;

								var name = pieces.join('.');
								var buff = await get(`${store}/${pieces.join('/')}`);
								fUtil.addToZip(zip, name, buff);
								themes[pieces[0]] = true;
								break;
							}
							case 'char': {
								var val = piece.childNamed('action').val;
								var pieces = val.split('.');

								var theme, fileName, buffer;
								switch (pieces[pieces.length - 1]) {
									case 'xml': {
										theme = pieces[0];
										const id = pieces[1];

										buffer = Buffer.from(await char.load(id));
										fileName = `${theme}.char.${id}.xml`;
										var charTheme = /theme_id="([^"]+)/.exec(buffer)[1];
										if (theme == 'ugc')
											ugcString += `<char id="${id}"cc_theme_id="${charTheme}"><tags/></char>`;
										break;
									}
									case 'swf': {
										theme = pieces[0];
										const char = pieces[1];
										const model = pieces[2];
										let url = `${store}/${theme}/char/${char}/${model}.swf`;
										fileName = `${theme}.char.${char}.${model}.swf`;
										buffer = await get(url);
										break;
									}
								}
								themes[theme] = true;
								fUtil.addToZip(zip, fileName, buffer);
								break;
							}
							case 'bubbleAsset': {
								const bubble = piece.childNamed('bubble');
								const text = bubble.childNamed('text');
								const fontSrc = `${source}/go/font/FontFile${text.attr.font}.swf`;
								fUtil.addToZip(zip, `FontFile${text.attr.font}.swf`, await get(fontSrc));
								break;
							}
						}
					}
					break;
			}
		}

		if (themes.family) {
			delete themes.family;
			themes.custom = true;
		}

		const themeKs = Object.keys(themes);
		themeKs.forEach(t => {
			if (t == 'ugc') return;
			const file = fs.readFileSync(`${themeFolder}/${t}.xml`);
			fUtil.addToZip(zip, `${t}.xml`, file);
		});

		fUtil.addToZip(zip, 'themelist.xml', Buffer.from(`${header}<themes>${
			themeKs.map(t => `<theme>${t}</theme>`).join('')}</themes>`));
		fUtil.addToZip(zip, 'ugc.xml', Buffer.from(ugcString + `</theme>`));
		return await zip.zip();
	},
	/**
	 * 
	 * @param {{[aId:string]:Buffer}} buffers
	 * @returns {Promise<Buffer>}
	 */
	async zip2xml(zip, buffers = []) {
		return new Promise(res => {
			const pieces = [];
			const stream = zip['movie.xml'].toReadStream();
			stream.on('data', b => pieces.push(b));
			stream.on('end', () => {
				var xmlBuffers = [Buffer.concat(pieces).slice(0, -7)];
				for (const aId in buffers) {
					if (useBase64(aId))
						xmlBuffers.push(Buffer.from(`<asset id="${aId}">${buffers[aId]}</asset>`));
					else {
						const assetString = buffers[aId].toString('base64');
						xmlBuffers.push(Buffer.from(`<asset id="${aId}">${assetString}</asset>`));
					}
				}

				xmlBuffers.push(Buffer.from(`</film>`));
				res(Buffer.concat(xmlBuffers));
			});
		});
	}
}