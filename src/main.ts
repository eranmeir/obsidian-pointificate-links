import { Editor, Plugin, PluginSettingTab, SettingDefinitionItem } from 'obsidian';
import { EditorState, Extension } from '@codemirror/state';

interface PointificateSettings {
	autoConvert: boolean;
}

const DEFAULT_SETTINGS: PointificateSettings = {
	autoConvert: true,
};

// [text](dest%20with%20percent) -- destinations that are not already in <pointy brackets>
const ENCODED_LINK_SOURCE = /\[([^\][]*)\]\(([^()<>]*%+[^()<>]*)\)/.source;

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
				const [whole, linkText, destination] = m;
				if (whole === undefined || linkText === undefined || destination === undefined) continue;
				const replacement = pointify(linkText, destination);
				if (replacement === null) continue;
				const from = fromB + m.index;
				edits.push({ from, to: from + whole.length, insert: replacement });
			}
		});
		if (edits.length === 0) return tr;

		// Positions in `edits` refer to the document after `tr`, hence sequential.
		return [tr, { changes: edits, sequential: true }];
	});
}

export default class PointificateLinksPlugin extends Plugin {
	settings: PointificateSettings = { ...DEFAULT_SETTINGS };

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(buildTransactionFilter(this));
		this.addSettingTab(new PointificateSettingTab(this.app, this));

		this.addCommand({
			id: 'convert-urlencoded-links-to-pointy',
			name: 'Decode links and enclose in pointy brackets',
			editorCallback: (editor: Editor) => {
				this.convertLinks(editor);
			}
		});
	}

	async loadSettings() {
		const saved = (await this.loadData()) as Partial<PointificateSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...saved };
	}

	convertLinks(editor: Editor) {
		let documentText = editor.getValue();

		for (const m of editor.getValue().matchAll(new RegExp(ENCODED_LINK_SOURCE, 'gm'))) {
			const [match, text, destination] = m;
			if (match === undefined || text === undefined || destination === undefined) continue;
			const replacement = pointify(text, destination);
			if (replacement !== null) documentText = documentText.replace(match, () => replacement);
		}

		editor.setValue(documentText);
	}
}

/**
 * Declarative settings (Obsidian 1.13+). The default storage reads and writes
 * `plugin.settings`, which is where this plugin keeps its settings.
 */
class PointificateSettingTab extends PluginSettingTab {
	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Automatically use pointy brackets',
				desc: 'When a Markdown link is inserted with a URL-encoded destination, such as by link autocomplete or paste, decode it and enclose it in pointy brackets. Links changed outside the editor, such as by renaming a file, are not affected; use the command instead.',
				control: { type: 'toggle', key: 'autoConvert', defaultValue: DEFAULT_SETTINGS.autoConvert },
			},
		];
	}
}
