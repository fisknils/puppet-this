/**
 * Extract ld+json schemas from pages.
 */
return (() => 
    JSON.stringify(
        [...document.querySelectorAll('script[type="application/ld+json"]')]
            .map( script => JSON.parse(script.textContent ) ),
        null,
        2
    )
)();