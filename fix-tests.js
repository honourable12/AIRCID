import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all test files
function findTestFiles(dir, testFiles = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath, testFiles);
    } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
      testFiles.push(filePath);
    }
  }
  
  return testFiles;
}

// Function to convert Vitest syntax to Jest
function convertVitestToJest(content) {
  // Replace Vitest imports with Jest equivalents
  content = content.replace(
    /import\s*{\s*([^}]*vi[^}]*)\s*}\s*from\s*['"]vitest['"];?/g,
    (match, imports) => {
      // Remove vi and replace with jest equivalents where needed
      const cleanImports = imports
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp !== 'vi')
        .join(', ');
      
      if (cleanImports) {
        return `import { ${cleanImports} } from '@jest/globals';`;
      } else {
        return ''; // Remove the import entirely if only vi was imported
      }
    }
  );
  
  // Replace vi.mock with jest.mock
  content = content.replace(/vi\.mock\(/g, 'jest.mock(');
  
  // Replace vi.mocked with jest.mocked or manual typing
  content = content.replace(/vi\.mocked\(/g, '');
  content = content.replace(/\) as jest\.Mocked<[^>]+>/g, '');
  content = content.replace(/const mock(\w+) = ([^;]+);/g, (match, name, service) => {
    return `const mock${name} = ${service} as jest.Mocked<typeof ${service.toLowerCase()}>;`;
  });
  
  // Replace vi.fn() with jest.fn()
  content = content.replace(/vi\.fn\(\)/g, 'jest.fn()');
  
  // Replace vi.clearAllMocks() with jest.clearAllMocks()
  content = content.replace(/vi\.clearAllMocks\(\)/g, 'jest.clearAllMocks()');
  
  // Replace vi.resetAllMocks() with jest.resetAllMocks()
  content = content.replace(/vi\.resetAllMocks\(\)/g, 'jest.resetAllMocks()');
  
  // Replace vi.importActual with jest.requireActual
  content = content.replace(/vi\.importActual/g, 'jest.requireActual');
  
  // Replace it() with test()
  content = content.replace(/\bit\(/g, 'test(');
  
  return content;
}

// Main function
function main() {
  const srcDir = path.join(__dirname, 'src');
  const testFiles = findTestFiles(srcDir);
  
  console.log(`Found ${testFiles.length} test files`);
  
  for (const testFile of testFiles) {
    try {
      let content = fs.readFileSync(testFile, 'utf8');
      const originalContent = content;
      
      content = convertVitestToJest(content);
      
      if (content !== originalContent) {
        fs.writeFileSync(testFile, content, 'utf8');
        console.log(`✓ Updated ${testFile}`);
      } else {
        console.log(`- No changes needed for ${testFile}`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${testFile}:`, error.message);
    }
  }
  
  console.log('Conversion complete!');
}

main();
