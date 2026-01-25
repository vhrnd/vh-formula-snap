/**
 * LaTeX Normalization Utility
 * 
 * Handles cleaning and normalization of LaTeX strings from OCR output.
 * Focuses on removing redundant whitespace while preserving necessary spaces
 * for commands (e.g., \tan x) and text blocks (e.g., \text{...}).
 */

/**
 * Normalizes a LaTeX string by compacting whitespace in math mode
 * but preserving it in text mode and around commands.
 * 
 * @param latex The raw LaTeX string
 * @returns Normalized LaTeX string
 */
export function normalizeLatex(latex: string): string {
    if (!latex) return '';

    // First, remove negative space characters (\!) globally
    // Also replacing tilde (~) with space, allowing the subsequent whitespace normalization
    // to strip it or preserve it contextually (e.g. \tan~x -> \tan x)
    let cleaned = latex.replace(/\\!/g, '').replace(/~/g, ' ');

    // Tokenize string into segments of "math" and "text" to handle \text{...} correctly
    const segments = tokenizeLatex(cleaned);

    let result = '';

    for (const segment of segments) {
        if (segment.type === 'text') {
            // In text mode, we just keep the content as is (or maybe minimal normalization of spaces?)
            // For now, let's keep it safe and just append. 
            // The segment.content includes the \text{ and } wrapper if we want to preserve them purely
            // But tokenizeLatex returns the inner content usually? Let's check implementation.
            // Actually simpler: let's have tokenize return chunks that are either "math" or "protected"
            result += segment.content;
        } else {
            // Math mode normalization
            result += normalizeMath(segment.content);
        }
    }

    // Final clean up of start/end garbage
    return result.replace(/^[:~,]+|[:~,]+$/g, '');
}

interface LatexSegment {
    type: 'math' | 'text';
    content: string;
}

function tokenizeLatex(input: string): LatexSegment[] {
    const segments: LatexSegment[] = [];
    let currentIndex = 0;

    // Simple parser to find \text{...} blocks
    // This supports nested braces inside \text{}

    while (currentIndex < input.length) {
        const textIdx = input.indexOf('\\text{', currentIndex);

        if (textIdx === -1) {
            // No more text blocks, the rest is math
            segments.push({
                type: 'math',
                content: input.slice(currentIndex)
            });
            break;
        }

        // Before the \text{ is math
        if (textIdx > currentIndex) {
            segments.push({
                type: 'math',
                content: input.slice(currentIndex, textIdx)
            });
        }

        // Find the balanced closing brace for \text{
        const startBrace = textIdx + 5; // length of "\text" is 5. Wait, it's "\text{" so 6 chars?
        // \text{ starts at textIdx.
        // input[textIdx] = \
        // input[textIdx+1] = t
        // ...
        // input[textIdx+4] = t
        // input[textIdx+5] = {

        let braceDepth = 1;
        let p = startBrace + 1;
        let foundEnd = false;

        while (p < input.length) {
            if (input[p] === '{') {
                braceDepth++;
            } else if (input[p] === '}') {
                braceDepth--;
            }

            if (braceDepth === 0) {
                foundEnd = true;
                break;
            }
            p++;
        }

        if (foundEnd) {
            // Include the full \text{...} block as "text" segment
            // We want to preserve the command \text{...} itself structure?
            // Actually, we usually want to treat the *content* as text, but the command is part of the syntax.
            // But if we want to AVOID cleaning inside, we treat the whole block as protected.
            segments.push({
                type: 'text',
                content: input.slice(textIdx, p + 1)
            });
            currentIndex = p + 1;
        } else {
            // Malformed LaTeX (unclosed brace), treat rest as math? or just text?
            // Let's treat it as math to be safe (it will just strip spaces)
            segments.push({
                type: 'math',
                content: input.slice(currentIndex)
            });
            break;
        }
    }

    return segments;
}

function normalizeMath(mathStr: string): string {
    // 1. Protect explicit spaces "\ "
    // We can replace them with a placeholder that doesn't contain space
    const SPACE_PLACEHOLDER = '__SPACE__';
    let temp = mathStr.replace(/\\ /g, SPACE_PLACEHOLDER);

    // 2. Remove all other whitespaces
    temp = temp.replace(/\s+/g, '');

    // 3. Restore explicit spaces
    temp = temp.replace(new RegExp(SPACE_PLACEHOLDER, 'g'), '\\ ');

    // 4. Ensure space after backslash commands if followed by a letter
    // Pattern: (\\[a-zA-Z]+) captures command like \tan
    // (?=[a-zA-Z]) checks if followed by a letter (e.g. x)
    // We insert a space => "$1 "
    // Note: We need to be careful not to break things like \alpha\beta
    // LateX allows \alpha\beta. But \tanx is invalid, it must be \tan x.
    // Generally, if a command ends in letters, and the next char is a letter, it consumes it.
    // So \tanx is parsed as command "tanx".
    // If we have "tan x" originally -> becomes "tanx" -> likely wrong if OCR meant "tan x".
    // However, we just stripped all spaces.
    // Issue: If regex stripped "\tan x" to "\tanx", we are now stuck.
    // BUT, wait. OCR output usually has spaces.
    // If we strip ALL spaces, "\tan x" becomes "\tanx".
    // Then we try to fix it? No, checking "\tanx" against known commands is hard.

    // Better strategy for Step 2:
    // Don't strip ALL spaces blindly.
    // Strip spaces, BUT if it was separating a command (ending in letters) and a letter, KEEP it.

    // Let's re-do normalizeMath with that in mind.

    // Reset from input
    // Protect "\ "
    temp = mathStr.replace(/\\ /g, SPACE_PLACEHOLDER);

    // We want to remove spaces that are NOT significant.
    // Significant spaces are:
    // 1. Between a command (alpha chars) and a following alpha char. e.g. "\tan x"
    // 2. What else? "\frac 1 2" -> "\frac12" is fine. "\sqrt 2" -> "\sqrt2" is fine.

    // So logic:
    // Replace \s+ with nothing...
    // UNLESS it is preceded by \\[a-zA-Z]+ AND followed by [a-zA-Z]

    // We can do this with a replace with callback or lookbehind (if supported).
    // JS supports lookbehind in newer text, but let's be safe.

    // Regex for space removal:
    // (\\[a-zA-Z]+)\s+(?=[a-zA-Z]) -> preserve this space (normalize to single space)
    // other \s+ -> remove

    temp = temp.replace(/(\\[a-zA-Z]+)\s+(?=[a-zA-Z])/g, '$1\uE000'); // Mark significant spaces with placeholder

    // Now remove all remaining spaces
    temp = temp.replace(/\s+/g, '');

    // Restore significant spaces
    temp = temp.replace(/\uE000/g, ' ');

    // Restore explicit spaces
    temp = temp.replace(new RegExp(SPACE_PLACEHOLDER, 'g'), '\\ ');

    return temp;
}
