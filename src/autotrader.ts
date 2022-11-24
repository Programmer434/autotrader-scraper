import * as puppeteer from 'puppeteer'
import bunyan from 'bunyan'

const logger = bunyan.createLogger({ name: 'scrapertron' })

async function start() {
    logger.info('Starting logger scraper')

    let browser: puppeteer.Browser
    if (process.env.IS_CI === 'true') {
        logger.info('running in CI env ')

        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--single-process',
            ],
        })
        logger.info('browser started')
    } else {
        logger.info('running locally')
        browser = await puppeteer.launch()
    }

    const page = await browser.newPage()
    logger.info('page created')
    //This is needed otherwise request gets blocked
    page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36'
    )

    await page.goto(
        process.env.TARGET_URL ||
            'https://www.autotrader.co.uk/car-search?postcode=RG5%203AY&make=Audi&model=A4&price-from=5000&price-to=10000&include-delivery-option=on&advertising-location=at_cars&page=1'
    )
    logger.info('loaded page')
    const carPrices = await getPrices(page)

    const subStories = await getCarSubDetails(page)

    let listOfCarDetails = []
    for (let index = 0; index < subStories.length; index++) {
        const element = subStories[index]
        let finalObj = {}
        element.map((element) => {
            let carAttribute = carDescriptionDiscovery(element)
            if (carAttribute) {
                finalObj = { ...finalObj, [carAttribute]: element }
            }
        })
        //add in the price
        finalObj = { ...finalObj, price: carPrices[index] }
        listOfCarDetails.push(finalObj)
    }

    logger.info('Successfully scraped page')
    logger.info(listOfCarDetails[0])
    await browser.close()
}

export async function getCarSubDetails(
    page: puppeteer.Page
): Promise<string[][]> {
    return await page.$$eval('.listing-key-specs', (anchors) => {
        return anchors.map((anchor) => {
            let list = []
            for (const child of anchor.children) {
                list.push(child.innerHTML)
            }
            return list
        })
    })
}

export async function getPrices(
    page: puppeteer.Page
): Promise<(string | undefined)[]> {
    return await page.$$eval('.product-card-pricing__price', (anchors) => {
        return anchors.map((anchor) => anchor.textContent?.trim())
    })
}

export function carDescriptionDiscovery(
    stringToDiscover: string
): string | undefined {
    //We dont have any context, only the string, and they can be in any random order.
    //So we must work out what we're looking at and give it context.
    stringToDiscover = stringToDiscover.toLowerCase()
    const carTypes = [
        'hatchback',
        'estate',
        'suv',
        'saloon',
        'coupe',
        'convertible',
        'mpv',
        'pickup',
    ]

    if (stringToDiscover.includes('ulez')) {
        return 'emission'
    }
    if (stringToDiscover.includes('reg')) {
        return 'year'
    }

    if (carTypes.some((el) => stringToDiscover.includes(el))) {
        return 'bodyType'
    }

    if (
        stringToDiscover.includes('manual') ||
        stringToDiscover.includes('automatic')
    ) {
        return 'drivetrain'
    }

    if (stringToDiscover.includes(',')) {
        return 'mileage'
    }

    return undefined
}

start()
