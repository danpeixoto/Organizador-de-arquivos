const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const readdir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);

const config = {
    watchFolder: 'C:\\Users\\peixo\\Downloads',
    moveFolder: 'C:\\Users\\peixo\\Downloads',
    ignoreExtensions: ['.js', '.json'],
    folders: {
        IMAGE: ['png', 'jpg', 'jpeg', 'gif'],
        PDF: ['pdf'],
        EXE: ['exe', 'msi'],
        ZIP: ['rar', 'zip']
    }
};

function chooseFolderToMove(extension) {
    try {
        const [folderName] = Object.entries(config.folders).find(([key, value]) => {
            return value.includes(extension.toLowerCase());
        }) || [];
        return folderName || 'OUTROS';
    } catch (error) {
        console.error({ error });
    }
}

function handleFolderCreation(extension) {
    const formatedExtension = extension.replace('.', '');
    const folderName = chooseFolderToMove(formatedExtension);
    const destinationFolderPath = path.join(config.moveFolder, folderName);

    if (!fs.existsSync(destinationFolderPath)) {
        fs.mkdirSync(destinationFolderPath);
    }
    return destinationFolderPath;
}

function moveFile(fileName, folderPath) {
    return new Promise((resolve, reject) => {
        const currentFilePath = path.join(folderPath, fileName);
        const fileExtension = path.extname(fileName).toUpperCase();

        if (config.ignoreExtensions.find(ext => ext.toUpperCase() === fileExtension.toUpperCase())) {
            return resolve();
        }

        const destinationFolder = handleFolderCreation(fileExtension);

        // Move the file to the destination folder
        fs.rename(currentFilePath, path.join(destinationFolder, fileName), (err) => {
            if (err) {
                console.error(`Error moving file ${destinationFolder}:`, err);
                reject();
            } else {
                console.log(`Moved ${fileName} to ${destinationFolder}`);
                resolve();
            }
        });

    });
}

async function organizeFolder(folderPath) {
    const normalizedFolderPath = path.normalize(folderPath);
    try {
        const folderContent = await readdir(normalizedFolderPath);
        let files = [];

        for (const element of folderContent) {
            const filePath = path.join(normalizedFolderPath, element);
            const result = await fileStat(filePath);
            if (result.isFile()) { files.push(element); }
        }

        const handleFilePromies = files.map(fileName => {
            return moveFile(fileName, normalizedFolderPath);
        });

        await Promise.allSettled(handleFilePromies);
    } catch (error) {
        console.error('Error organizing files:', error);
    }
}

organizeFolder(config.watchFolder);
