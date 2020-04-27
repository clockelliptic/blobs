let purgecss = require('@fullhuman/postcss-purgecss')({
    content: [
        './src/**/*.html',
        './src/**/*.svelte'
    ],
    whitelistPatterns: [/svelte-/],
    defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || []
})
let cssnano = require('cssnano')({ preset: 'default'})


const production = process.env.NODE_ENV === 'production'

const productionPlugins = () => !production ? [] : [
    cssnano,
    purgecss
]

module.exports = {
    plugins: [
        require("postcss-import")(),
        require("tailwindcss"),
        require('autoprefixer'),
        ...productionPlugins()
    ]
};