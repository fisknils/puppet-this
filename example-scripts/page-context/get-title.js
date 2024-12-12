/**
 * Since this is to be evaluated in nodejs,
 * we might just as well use conventional methods for importing it.
 */
export default async function( page ) {
    return await page.evaluate(
        () => document.querySelector('title').innerText, // That's what we're doing *in* the browser.
        context = null,
        resolver = null,
        type = null,
        result = null
    );
};