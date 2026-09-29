// Idiomas disponibles para ideas y libros
export const LANGUAGES = [
  { code: 'es', label: 'Español', ai: 'Spanish (español)', t: { chapter: 'Capítulo', contents: 'Contenido', rights: 'Todos los derechos reservados.', copy1: 'Ninguna parte de esta publicación puede ser reproducida, distribuida o transmitida por ningún medio sin el permiso previo por escrito del autor.', copy2: 'La información de este libro tiene fines educativos e informativos. El autor no se hace responsable del uso que se le dé.', about: 'Sobre el autor', guide: 'Guía práctica' } },
  { code: 'en', label: 'English', ai: 'English', t: { chapter: 'Chapter', contents: 'Contents', rights: 'All rights reserved.', copy1: 'No part of this publication may be reproduced, distributed or transmitted in any form or by any means without the prior written permission of the author.', copy2: 'The information in this book is for educational and informational purposes only. The author is not responsible for how it is used.', about: 'About the author', guide: 'Practical guide' } },
  { code: 'fr', label: 'Français', ai: 'French (français)', t: { chapter: 'Chapitre', contents: 'Sommaire', rights: 'Tous droits réservés.', copy1: "Aucune partie de cette publication ne peut être reproduite, distribuée ou transmise sous quelque forme que ce soit sans l'autorisation écrite préalable de l'auteur.", copy2: "Les informations de ce livre sont fournies à des fins éducatives et informatives. L'auteur décline toute responsabilité quant à leur utilisation.", about: "À propos de l'auteur", guide: 'Guide pratique' } },
  { code: 'zh', label: '中文 (Chino)', ai: 'Simplified Chinese (简体中文)', t: { chapter: '第', chapterSuffix: '章', contents: '目录', rights: '版权所有。', copy1: '未经作者事先书面许可，不得以任何形式或任何方式复制、分发或传播本出版物的任何部分。', copy2: '本书内容仅供教育和参考之用，作者对其使用不承担任何责任。', about: '关于作者', guide: '实用指南' } },
  { code: 'it', label: 'Italiano', ai: 'Italian (italiano)', t: { chapter: 'Capitolo', contents: 'Indice', rights: 'Tutti i diritti riservati.', copy1: "Nessuna parte di questa pubblicazione può essere riprodotta, distribuita o trasmessa in alcuna forma o con alcun mezzo senza il previo consenso scritto dell'autore.", copy2: "Le informazioni contenute in questo libro hanno scopo educativo e informativo. L'autore non è responsabile dell'uso che ne viene fatto.", about: "Sull'autore", guide: 'Guida pratica' } },
  { code: 'pt', label: 'Português', ai: 'Portuguese (português)', t: { chapter: 'Capítulo', contents: 'Sumário', rights: 'Todos os direitos reservados.', copy1: 'Nenhuma parte desta publicação pode ser reproduzida, distribuída ou transmitida por qualquer meio sem a permissão prévia por escrito do autor.', copy2: 'As informações deste livro têm fins educativos e informativos. O autor não se responsabiliza pelo uso que delas for feito.', about: 'Sobre o autor', guide: 'Guia prático' } },
  { code: 'hi', label: 'हिन्दी (Hindi)', ai: 'Hindi (हिन्दी)', t: { chapter: 'अध्याय', contents: 'विषय सूची', rights: 'सर्वाधिकार सुरक्षित।', copy1: 'लेखक की पूर्व लिखित अनुमति के बिना इस प्रकाशन के किसी भी भाग को किसी भी रूप में पुन: प्रस्तुत, वितरित या प्रसारित नहीं किया जा सकता।', copy2: 'इस पुस्तक की जानकारी केवल शैक्षिक और सूचनात्मक उद्देश्यों के लिए है। लेखक इसके उपयोग के लिए जिम्मेदार नहीं है।', about: 'लेखक के बारे में', guide: 'व्यावहारिक गाइड' } },
];

// Acepta código ("es") o nombre antiguo ("Español", "English", "Português")
export function getLang(value) {
  const v = String(value || '').toLowerCase();
  return (
    LANGUAGES.find((l) => l.code === v) ||
    LANGUAGES.find((l) => l.label.toLowerCase() === v) ||
    LANGUAGES.find((l) => v && l.label.toLowerCase().startsWith(v.slice(0, 4))) ||
    LANGUAGES[0]
  );
}

export function chapterLabel(lang, n) {
  const L = getLang(lang);
  return L.t.chapterSuffix ? `${L.t.chapter}${n}${L.t.chapterSuffix}` : `${L.t.chapter} ${n}`;
}

// Fuentes extra para alfabetos que las plantillas no cubren
export function extraFonts(lang) {
  const c = getLang(lang).code;
  if (c === 'zh') return { family: 'Noto Sans SC', css: 'Noto+Sans+SC:wght@400;700;900' };
  if (c === 'hi') return { family: 'Noto Sans Devanagari', css: 'Noto+Sans+Devanagari:wght@400;700;900' };
  return null;
}
