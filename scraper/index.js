const PORT = 9000;
import axios from 'axios';
import express from 'express';
import * as cheerio from 'cheerio';

const app = express();

const url = 'https://claim.ens.domains/delegate-ranking';

axios(url)
    .then(res => {
        console.log(res.data)
        const html = res.data;
        const $ = cheerio.load(html);
        const delegates = [];

        $('div.sc-dtDOqo jWEXDa', html).each(function () {
            const name = $(this).$('div.sc-ilfuhL hrBoBi').$('img.sc-dkYRCH eJUNKa').attr('src');
            const img = $(this).find('img').attr('src');
            delegates.push({
                name,
                img
            })
        })
        console.log(delegates);
    }).catch(err => console.log(err))

app.listen(PORT, () => console.log(`App listening on ${PORT}`));