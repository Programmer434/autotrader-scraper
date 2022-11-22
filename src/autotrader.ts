import * as puppeteer from "puppeteer";

async function start() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });
  const page = await browser.newPage();

  await page.goto(
    "https://www.autotrader.co.uk/car-search?postcode=RG5%203AY&make=Audi&model=A4&price-from=5000&price-to=10000&include-delivery-option=on&advertising-location=at_cars&page=1"
  );

  const carPrices = await page.$$eval(
    ".product-card-pricing__price",
    (anchors) => {
      return anchors.map((anchor) => anchor.textContent?.trim());
    }
  );

  console.log(carPrices);

  const subStories = await page.$$eval(".listing-key-specs", (anchors) => {
    return anchors.map((anchor) => {
      let list = [];
      for (const child of anchor.children) {
        list.push(child.innerHTML);
      }
      return list;
    });
  });

  let listOfCarDetails = [];
  for (let index = 0; index < subStories.length; index++) {
    const element = subStories[index];
    let finalObj = {};
    element.map((element, index) => {
      let carAttribute = carDescriptionDiscovery(element);
      if (carAttribute) {
        finalObj = { ...finalObj, [carAttribute]: element };
      }
    });
    //add in the price
    finalObj = { ...finalObj, price: carPrices[index] };
    listOfCarDetails.push(finalObj);
  }
  console.log(listOfCarDetails[0]);

  // Print all the files.

  await browser.close();
}

start();
function carDescriptionDiscovery(stringToDiscover: string): string | undefined {
  //We dont have any context, only the string, and they can be in any random order.
  //So we must work out what we're looking at and give it context.
  stringToDiscover = stringToDiscover.toLowerCase();
  const carTypes = [
    "hatchback",
    "estate",
    "suv",
    "saloon",
    "coupe",
    "convertible",
    "mpv",
    "pickup",
  ];

  if (stringToDiscover.includes("ulez")) {
    return "emission";
  }
  if (stringToDiscover.includes("reg")) {
    return "year";
  }

  if (carTypes.some((el) => stringToDiscover.includes(el))) {
    return "bodyType";
  }

  if (
    stringToDiscover.includes("manual") ||
    stringToDiscover.includes("automatic")
  ) {
    return "drivetrain";
  }

  if (stringToDiscover.includes(",")) {
    return "mileage";
  }

  return undefined;
}
