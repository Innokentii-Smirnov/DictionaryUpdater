import fs from 'fs';
import jsdom from 'jsdom';
import {Writable} from 'stream';
import {SelectedMorphAnalysis, readSelectedMorphology}
  from '../tlh/ui/src/model/selectedMorphologicalAnalysis';
import {readMorphologicalAnalysis, writeMorphAnalysisValue}
  from '../tlh/ui/src/model/morphologicalAnalysis';
import {isSelected, convertToSingleIfAppropriate}
  from '../tlh/ui/src/xmlEditor/hur/morphologicalAnalysis/auxiliary';
import {add, formIsFragment} from '../tlh/ui/src/xmlEditor/hur/common/utils';
import {basicSaveGloss} from '../tlh/ui/src/xmlEditor/hur/translations/glossUpdater';

export function extractXml(filename: string, log: Writable, dictionary: Map<string, Set<string>>) {
  const fileText = fs.readFileSync(filename, 'utf8');
  const dom = new jsdom.JSDOM(fileText, {contentType: 'text/xml'});
  const text = dom.window.document.getElementsByTagName('text')[0];
  let lg: string | null = 'Hit';
  let lnr: string | null = 'unk';
  for (const child of text.children) {
    switch (child.nodeName) {
      case 'lb':
        lg = child.getAttribute('lg');
        lnr = child.getAttribute('lnr');
        break;
      case 'w':
        if (lg === 'Hur') {
          const trans = child.getAttribute('trans');
          if (trans !== null) {
            const mrp0sel = child.getAttribute('mrp0sel');
            const selectedMorphologies: SelectedMorphAnalysis[] = mrp0sel !== null
              ? readSelectedMorphology(mrp0sel)
              : [];
            for (const attr of child.attributes) {
              if (attr.name.startsWith('mrp') &&
                  attr.name !== 'mrp0sel' &&
                  attr.name !== 'mrpNaN') {
                const morphologicalAnalysis = readMorphologicalAnalysis(
                  parseInt(attr.name.substring(3)),
                  attr.value,
                  selectedMorphologies
                );
                if (morphologicalAnalysis !== undefined) {
                  if (isSelected(morphologicalAnalysis)) {
                    if (!formIsFragment(morphologicalAnalysis.referenceWord)) {
                      const converted = convertToSingleIfAppropriate(morphologicalAnalysis);
                      const value = writeMorphAnalysisValue(converted);
                      add(dictionary, trans, value);
                      basicSaveGloss(converted);
                      log.write(`\t\t${trans}\t${mrp0sel}\t${value}\n`);
                    }
                  }
                }
              }
            }
          } else {
            //log.write(`\t\t${lnr}\t${child.innerHTML}\n`);
          }
        }
        break;
    }
  }
}
