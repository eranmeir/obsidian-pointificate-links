import { Editor, MarkdownView, Plugin } from 'obsidian';

export default class PointificateLinksPlugin extends Plugin {
	async onload() {
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'convert-urlencoded-links-to-pointy',
			name: 'Decode links and enclose in pointy brackets',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				this.convertLinks(editor, view)
			}
		});
	}

	onunload() {

	}

	convertLinks(editor: Editor, view: MarkdownView) {
		const encodedLinksRegex = new RegExp(/\[([^\]\[]*)\]\(([^()<>]*(?:%)+[^()<>]*)\)/gm); // eslint-disable-line no-useless-escape
		
		let documentText = editor.getValue();

		const matches = editor.getValue().matchAll(encodedLinksRegex);
		for (const m of matches) {
			const [match, text, destination] = m;
			const decodedLink = `[${text}](<${decodeURIComponent(destination)}>)`
			// console.log(`Replacing: ${match} -> ${decodedLink}`);
			documentText = documentText.replace(match, decodedLink)
		}
			
		editor.setValue(documentText);
	}
}
