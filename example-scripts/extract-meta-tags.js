return (() => JSON.stringify(
        [...document.querySelectorAll('meta[name]')].map(
            meta => {
                const name = meta.getAttribute('name');
                const content = meta.getAttribute('content');

                return { name, content };
            },
        ),
        null,
        2
    )
)();