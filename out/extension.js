"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Returns the light variant icon ID for a given dark icon ID.
 * If the icon ID ends with _light, returns it as-is.
 * If a _light variant exists in iconDefinitions, returns that.
 * Otherwise returns the original ID.
 */
function getLightIconId(darkIconId, iconDefinitions) {
    if (darkIconId.endsWith('_light')) {
        return darkIconId;
    }
    const lightId = darkIconId + '_light';
    if (lightId in iconDefinitions) {
        return lightId;
    }
    // For folder icons that don't have separate light variants
    return darkIconId;
}
function generateIconTheme(baseTheme, useOnAllFolders, folderAssociations) {
    // Deep clone to avoid mutating the base
    const theme = JSON.parse(JSON.stringify(baseTheme));
    const iconDefs = theme.iconDefinitions;
    // Handle "useOnAllFolders" setting
    if (useOnAllFolders) {
        // Keep the default folder icons (already in base theme)
        // Don't modify folder/folderExpanded — they stay as in the base
    }
    else {
        // Remove default folder icons — only folderNames associations will apply
        delete theme.folder;
        delete theme.folderExpanded;
        if (theme.light) {
            delete theme.light.folder;
            delete theme.light.folderExpanded;
        }
    }
    // Handle "folderAssociations" setting
    const folderNames = {};
    const folderNamesExpanded = {};
    const folderNamesLight = {};
    const folderNamesExpandedLight = {};
    for (const [folderName, iconId] of Object.entries(folderAssociations)) {
        if (!folderName || !iconId) {
            continue;
        }
        // Verify the icon exists in definitions
        if (!(iconId in iconDefs)) {
            console.warn(`Seti Folder Icons: Icon "${iconId}" not found for folder "${folderName}". Skipping.`);
            continue;
        }
        // Dark theme
        folderNames[folderName] = iconId;
        // Use _folder_open for expanded if available, otherwise the same icon
        folderNamesExpanded[folderName] = '_folder_open' in iconDefs ? '_folder_open' : iconId;
        // Light theme
        const lightIconId = getLightIconId(iconId, iconDefs);
        folderNamesLight[folderName] = lightIconId;
        folderNamesExpandedLight[folderName] = '_folder_open' in iconDefs ? '_folder_open' : lightIconId;
    }
    // Only add folderNames if there are associations
    if (Object.keys(folderNames).length > 0) {
        theme.folderNames = folderNames;
        theme.folderNamesExpanded = folderNamesExpanded;
    }
    if (Object.keys(folderNamesLight).length > 0) {
        if (!theme.light) {
            theme.light = {};
        }
        theme.light.folderNames = folderNamesLight;
        theme.light.folderNamesExpanded = folderNamesExpandedLight;
    }
    return theme;
}
function writeThemeFile(context, theme) {
    const themePath = path.join(context.extensionPath, 'icons', 'vs-seti-icon-theme.json');
    fs.writeFileSync(themePath, JSON.stringify(theme, null, '\t'), 'utf-8');
}
function loadBaseTheme(context) {
    // Try to load the base template (which is the original unmodified JSON)
    const basePath = path.join(context.extensionPath, 'icons', 'vs-seti-icon-theme.base.json');
    if (fs.existsSync(basePath)) {
        const raw = fs.readFileSync(basePath, 'utf-8');
        return JSON.parse(raw);
    }
    // Fallback: load the current theme file (might already be generated)
    const themePath = path.join(context.extensionPath, 'icons', 'vs-seti-icon-theme.json');
    const raw = fs.readFileSync(themePath, 'utf-8');
    return JSON.parse(raw);
}
function getWebviewContent(icons, fontUri, scriptUri, styleUri) {
    // Build icon cards HTML
    const iconEntries = Object.entries(icons).sort(([a], [b]) => a.localeCompare(b));
    const iconCards = iconEntries.map(([id, def]) => {
        let previewHtml;
        if (def.fontCharacter) {
            // Font-based icon — render the character
            const charCode = def.fontCharacter.replace(/\\\\/g, '\\');
            const color = def.fontColor || 'var(--vscode-foreground)';
            previewHtml = `<span class="icon-preview font-icon" style="color:${color};">${charCode}</span>`;
        }
        else if (def.iconPath) {
            // SVG-based icon — show a placeholder indicator
            previewHtml = `<span class="icon-preview svg-icon">SVG</span>`;
        }
        else {
            previewHtml = `<span class="icon-preview unknown-icon">?</span>`;
        }
        const escapedId = id.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `
		<div class="icon-card"
		     title="${escapedId}"
		     data-icon-id="${escapedId}"
		     onclick="copyIconId('${escapedId}')">
			<div class="icon-preview-wrapper">${previewHtml}</div>
			<div class="icon-name">${escapedId}</div>
		</div>`;
    }).join('\n');
    return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Seti Folder Icons</title>
	<style>
		@font-face {
			font-family: 'seti';
			src: url('${fontUri.toString()}') format('woff');
			font-weight: normal;
			font-style: normal;
		}

		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
			font-size: var(--vscode-font-size, 13px);
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			padding: 16px;
		}

		.header {
			margin-bottom: 16px;
		}

		.header h1 {
			font-size: 18px;
			font-weight: 600;
			margin-bottom: 4px;
		}

		.header p {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
		}

		.search-wrapper {
			margin-bottom: 16px;
		}

		#searchInput {
			width: 100%;
			padding: 6px 10px;
			font-size: 13px;
			font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
			color: var(--vscode-input-foreground);
			background-color: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border, transparent);
			border-radius: 2px;
			outline: none;
		}

		#searchInput:focus {
			border-color: var(--vscode-focusBorder);
		}

		#searchInput::placeholder {
			color: var(--vscode-input-placeholderForeground);
		}

		.icon-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: 8px;
		}

		.icon-card {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 10px 12px;
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.15s ease;
			border: 1px solid transparent;
			user-select: none;
		}

		.icon-card:hover {
			background-color: var(--vscode-list-hoverBackground);
			border-color: var(--vscode-list-focusOutline, var(--vscode-focusBorder));
		}

		.icon-card:active {
			background-color: var(--vscode-list-activeSelectionBackground);
			color: var(--vscode-list-activeSelectionForeground);
		}

		.icon-card.copied-flash {
			background-color: var(--vscode-list-activeSelectionBackground);
			color: var(--vscode-list-activeSelectionForeground);
		}

		.icon-preview-wrapper {
			flex-shrink: 0;
			width: 40px;
			height: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 4px;
			background-color: var(--vscode-badge-background);
		}

		.icon-preview {
			font-size: 28px;
			line-height: 1;
		}

		.font-icon {
			font-family: 'seti';
		}

		.svg-icon {
			font-size: 10px;
			font-family: var(--vscode-font-family);
			font-weight: 700;
			color: var(--vscode-descriptionForeground);
		}

		.unknown-icon {
			font-size: 18px;
			font-family: var(--vscode-font-family);
			color: var(--vscode-errorForeground);
		}

		.icon-name {
			font-size: 12px;
			font-family: var(--vscode-editor-font-family, monospace);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.icon-count {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 12px;
		}

		.hidden {
			display: none !important;
		}
	</style>
</head>
<body>
	<div class="header">
		<h1>Seti Folder Icons — Available Icons</h1>
		<p>Hover over an icon to see its name. Click to copy the icon ID to clipboard.</p>
	</div>

	<div class="search-wrapper">
		<input type="text" id="searchInput" placeholder="Filter icons by name..." autofocus />
	</div>

	<div class="icon-count" id="iconCount">${iconEntries.length} icons</div>

	<div class="icon-grid" id="iconGrid">
		${iconCards}
	</div>

	<script>
		const vscode = acquireVsCodeApi();

		function copyIconId(iconId) {
			vscode.postMessage({ command: 'copyIconId', iconId: iconId });

			// Visual flash feedback
			const card = document.querySelector('[data-icon-id="' + CSS.escape(iconId) + '"]');
			if (card) {
				card.classList.add('copied-flash');
				setTimeout(() => card.classList.remove('copied-flash'), 300);
			}
		}

		// Search/filter functionality
		document.getElementById('searchInput').addEventListener('input', function(e) {
			const query = e.target.value.toLowerCase().trim();
			const cards = document.querySelectorAll('.icon-card');
			let visibleCount = 0;
			cards.forEach(function(card) {
				const iconId = card.getAttribute('data-icon-id') || '';
				if (!query || iconId.toLowerCase().includes(query)) {
					card.classList.remove('hidden');
					visibleCount++;
				} else {
					card.classList.add('hidden');
				}
			});
			document.getElementById('iconCount').textContent =
				visibleCount + ' / ' + cards.length + ' icons';
		});
	</script>
</body>
</html>`;
}
function showIconBrowser(context) {
    const panel = vscode.window.createWebviewPanel('setiFolder.iconBrowser', 'Seti Folder Icons', vscode.ViewColumn.Active, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'icons')
        ]
    });
    // Load base theme to get icon definitions
    const baseTheme = loadBaseTheme(context);
    const iconDefs = baseTheme.iconDefinitions;
    // Get URI for the seti font
    const fontUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'icons', 'seti.woff'));
    // Set the webview HTML
    panel.webview.html = getWebviewContent(iconDefs, fontUri, vscode.Uri.parse(''), vscode.Uri.parse(''));
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'copyIconId') {
            const iconId = message.iconId;
            await vscode.env.clipboard.writeText(iconId);
            vscode.window.showInformationMessage(`Icon "${iconId}" copied to clipboard. Use it in your \`setiFolder.folderAssociations\` settings.`);
        }
    }, undefined, context.subscriptions);
}
function activate(context) {
    function applySettings() {
        const config = vscode.workspace.getConfiguration('setiFolder');
        const useOnAllFolders = config.get('useOnAllFolders', true);
        const folderAssociations = config.get('folderAssociations', {});
        const baseTheme = loadBaseTheme(context);
        const generatedTheme = generateIconTheme(baseTheme, useOnAllFolders, folderAssociations);
        writeThemeFile(context, generatedTheme);
    }
    // Apply settings on activation
    applySettings();
    // Watch for configuration changes
    const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('setiFolder.useOnAllFolders') ||
            e.affectsConfiguration('setiFolder.folderAssociations')) {
            applySettings();
        }
    });
    // Register the "Show Available Icons" command
    const commandDisposable = vscode.commands.registerCommand('setiFolder.showAvailableIcons', () => {
        showIconBrowser(context);
    });
    context.subscriptions.push(configDisposable, commandDisposable);
}
function deactivate() {
    // Nothing to clean up
}
//# sourceMappingURL=extension.js.map