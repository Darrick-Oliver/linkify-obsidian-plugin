import { EditorPosition } from "obsidian";

export const arePositionsEqual = (pos1: EditorPosition, pos2: EditorPosition) =>
	pos1.ch === pos2.ch && pos1.line === pos2.line;

export const isUrl = (value: string, isUrlRegex?: string) => {
	if (isUrlRegex) {
		const regex = new RegExp(ensureAnchors(isUrlRegex));
		return regex.test(value);
	}

	return URL.canParse(value);
};

const ensureAnchors = (regexStr: string) => {
	if (!regexStr.startsWith("^")) {
		regexStr = `^${regexStr}`;
	}
	if (!regexStr.endsWith("$")) {
		regexStr = `${regexStr}$`;
	}
	return regexStr;
};

export const matchMarkdownUrl = (value: string) =>
	/^\[(.*)\]\((.*)\)$/d.exec(value);

export const getWordFromContext = (
	start: EditorPosition,
	end: EditorPosition,
	lineContent: string
) => {
	const wordStart = getFirstSpacePosition(lineContent, start, -1);
	const wordEnd = getFirstSpacePosition(lineContent, end, 1);

	return { start: wordStart, end: wordEnd };
};

const getFirstSpacePosition = (
	lineContent: string,
	{ line, ch }: EditorPosition,
	direction: -1 | 1
) => {
	while (lineContent && !lineContent[ch]?.match(/\s/)) {
		if (direction === -1) {
			if (ch > 0) {
				ch--;
			} else {
				break;
			}
		} else if (direction === 1) {
			if (ch < lineContent.length) {
				ch++;
			} else {
				break;
			}
		}
	}

	if (lineContent[ch]?.match(/\s/) && direction === -1) {
		ch += 1;
	}

	return { line, ch };
};
