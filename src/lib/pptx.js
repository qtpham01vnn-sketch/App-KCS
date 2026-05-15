import JSZip from 'jszip';

/**
 * Tiện ích trích xuất văn bản từ tệp PowerPoint (.pptx)
 * Cấu trúc tệp PPTX là một gói ZIP chứa các tệp XML.
 * Văn bản nằm trong ppt/slides/slide[N].xml
 */
export async function extractPptxText(file, onProgress) {
  const zip = await JSZip.loadAsync(file);
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  
  // Sắp xếp slide theo thứ tự số
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

  const totalSlides = slideFiles.length;
  const slidesData = [];

  for (let i = 0; i < totalSlides; i++) {
    const content = await zip.file(slideFiles[i]).async('text');
    
    // Sử dụng DOMParser để bóc tách thẻ <a:t> chứa text
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    const textNodes = xmlDoc.getElementsByTagName('a:t');
    
    let slideText = '';
    for (let j = 0; j < textNodes.length; j++) {
      slideText += textNodes[j].textContent + ' ';
    }

    slidesData.push({
      slideIndex: i + 1,
      content: slideText.trim()
    });

    if (onProgress) onProgress(Math.round(((i + 1) / totalSlides) * 100));
  }

  return slidesData;
}
