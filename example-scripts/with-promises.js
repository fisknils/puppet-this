/**
 * Async example.
 * Waits for 5 seconds and then returns all script srcs
 * (for whatever reason... I couldn't come up with a better example).
 */
return ( async() => {
    await new Promise( resolve => setTimeout(resolve, 5000) );

    return Array.from(document.querySelectorAll('script')).map( script => script.src );
})();