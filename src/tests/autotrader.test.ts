import {
    getPrices,
    getCarSubDetails,
    carDescriptionDiscovery,
} from '../autotrader'
import { expect } from '@jest/globals'
import { Page } from 'puppeteer'

//Mongo things
import { mockClient } from 'aws-sdk-client-mock'
import {
    DynamoDBClient,
    ListGlobalTablesCommand,
} from '@aws-sdk/client-dynamodb'
const ddbMock = mockClient(DynamoDBClient)
import { testMongo } from '../autotrader'

describe('AutoTrader scaper gets correct details', () => {
    let page: Page
    beforeAll(async () => {
        page = await globalThis.__BROWSER_GLOBAL__.newPage()
        page.setUserAgent(
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36'
        )
        await page.goto(
            'https://www.autotrader.co.uk/car-search?postcode=RG5%203AY&make=Audi&model=A4&price-from=5000&price-to=10000&include-delivery-option=on&advertising-location=at_cars&page=1'
        )
    })

    it('should get the car prices"', async () => {
        const result = await getPrices(page)
        expect(result.length).toBeGreaterThan(1)
    })

    it('should get each cars details"', async () => {
        const result = await getCarSubDetails(page)
        expect(result.length).toBeGreaterThan(1)
    })

    test.each([
        ['2012 (reg)', 'year'],
        ['120,000', 'mileage'],
        ['saloon', 'bodyType'],
        ['ulez', 'emission'],
        ['manual', 'drivetrain'],
        ['unsupportedThing', undefined],
    ])('should classify each attribute correctly (%s, %s)', (a, expected) => {
        expect(carDescriptionDiscovery(a)).toBe(expected)
    })
})

describe(' Mongo calls', () => {
    beforeEach(() => {
        ddbMock.reset()
    })
    it('test a thing', async () => {
        ddbMock.on(ListGlobalTablesCommand).resolves({
            GlobalTables: [{ GlobalTableName: 'testTable' }],
        })
        const result = await testMongo()

        expect(result).toEqual({
            GlobalTables: [
                {
                    GlobalTableName: 'testTable',
                },
            ],
        })
    })
})
