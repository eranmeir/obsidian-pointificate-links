import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { EditorState, Extension } from '@codemirror/state';

interface PointificateSettings {
	autoConvert: boolean;
}

const DEFAULT_SETTINGS: PointificateSettings = {
	autoConvert: true,
};

// [text](dest%20with%20percent) -- destinations that are not already in <pointy brackets>
const ENCODED_LINK_SOURCE = /\[([^\]\[]*)\]\(([^()<>]*(?:%)+[^()<>]*)\)/.source; // eslint-disable-line no-useless-escape

/** Returns the pointy-bracket form of an encoded link, or null if it can't be safely converted. */
function pointify(text: string, destination: string): string | null {
	let decoded: string;
	try {
		decoded = decodeURIComponent(destination);
	} catch {
		return null; // malformed escape sequence, leave it alone
	}
	if (/[<>\n\r]/.test(decoded)) return null; // would break the <...> destination
	return `[${text}](<${decoded}>)`;
}

/**
 * Rewrites encoded links in text that was just inserted into the editor
 * (autocomplete, paste, drag-and-drop), in the same undo step.
 */
function buildTransactionFilter(plugin: PointificateLinksPlugin): Extension {
	return EditorState.transactionFilter.of((tr) => {
		if (!plugin.settings.autoConvert || !tr.docChanged) return tr;

		const edits: { from: number; to: number; insert: string }[] = [];
		tr.changes.iterChanges((_fromA, _toA, fromB, _toB, inserted) => {
			const text = inserted.toString();
			if (!text.includes('%')) return;
			for (const m of text.matchAll(new RegExp(ENCODED_LINK_SOURCE, 'g'))) {
				const replacement = pointify(m[1], m[2]);
				if (replacement === null) continue;
				const from = fromB + (m.index as number);
				edits.push({ from, to: from + m[0].length, insert: replacement });
			}
		});
		if (edits.length === 0) return tr;

		// Positions in `edits` refer to the document after `tr`, hence sequential.
		return [tr, { changes: edits, sequential: true }];
	});
}

export default class PointificateLinksPlugin extends Plugin {
	settings: PointificateSettings;

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(buildTransactionFilter(this));
		this.addSettingTab(new PointificateSettingTab(this.app, this));

		this.addCommand({
			id: 'convert-urlencoded-links-to-pointy',
			name: 'Decode links and enclose in pointy brackets',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.convertLinks(editor, view);
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	convertLinks(editor: Editor, view: MarkdownView) {
		let documentText = editor.getValue();

		for (const m of editor.getValue().matchAll(new RegExp(ENCODED_LINK_SOURCE, 'gm'))) {
			const [match, text, destination] = m;
			const replacement = pointify(text, destination);
			if (replacement !== null) documentText = documentText.replace(match, () => replacement);
		}

		editor.setValue(documentText);
	}
}

class PointificateSettingTab extends PluginSettingTab {
	plugin: PointificateLinksPlugin;

	constructor(app: App, plugin: PointificateLinksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Automatically use pointy brackets')
			.setDesc('When a Markdown link is inserted with a URL-encoded destination (e.g. by link autocomplete or paste), decode it and enclose it in pointy brackets. Links changed outside the editor, such as by renaming a file, are not affected; use the command instead.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.autoConvert).onChange(async (value) => {
					this.plugin.settings.autoConvert = value;
					await this.plugin.saveSettings();
				}));
	}
}
