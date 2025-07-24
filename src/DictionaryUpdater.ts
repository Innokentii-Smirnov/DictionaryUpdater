import fs from 'fs';
import os from 'os';
import path from 'path';
import {extractXml} from './xmlExtractor';
import {getDictionary} from '../tlh/ui/src/xmlEditor/hur/dict/dictionary';
import {getGlosses} from '../tlh/ui/src/xmlEditor/hur/translations/glossProvider';

const annotatedMarker = '_mit_Annotation';
const logName = 'DictionaryUpdater.log';
const outfileName = 'PrecompiledDictionary.json';
const documentsDirectory = path.join(os.homedir(), 'Documents');
const langDirectory = path.join(documentsDirectory, 'HurrianCorpus');
const corpusDirectory = 'TIVE BASISCORPUS ARBEITSBEREICH';
const inputDirectory = path.join(documentsDirectory, corpusDirectory);
const logFile = path.join(langDirectory, logName);
const log = fs.createWriteStream(logFile, 'utf8');
const outfile = path.join(langDirectory, outfileName);
for (const directory of fs.readdirSync(inputDirectory, {withFileTypes: true})) {
  if (directory.isDirectory() && directory.name.endsWith(annotatedMarker)) {
  log.write(directory.name + '\n');
    const fullDirectoryPath = path.join(inputDirectory, directory.name);
    for (const file of fs.readdirSync(fullDirectoryPath, {withFileTypes: true})) {
      if (file.isFile()) {
        const parsedName = path.parse(file.name);
        if (parsedName.ext === '.xml') {
          log.write('\t' + parsedName.name + '\n');
          const fullname = path.join(fullDirectoryPath, file.name);
          extractXml(fullname, log);
        }
      }
    }
  }
}
const dictionary = getDictionary();
const glosses = getGlosses();
const obj = {dictionary, glosses};
const jsonText = JSON.stringify(obj, undefined, '\t');
fs.writeFileSync(outfile, jsonText);
