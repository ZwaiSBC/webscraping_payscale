const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const mongoose = require("mongoose");
const Listing = require("./model/Listing");
const ObjectsToCsv = require('objects-to-csv');
//web_master:Nomathemba_2012

async function connectToMongoDb() {
    await mongoose.connect(
        "mongodb+srv://web_master:Nomathemba_2012@cluster0.7ez1m.mongodb.net/webscraping_dev", { useNewUrlParser: true }, { useUnifiedTopology: true }
    );
    console.log("connected to mongodb");
}

async function scrapeListings(page) {
    await page.goto(
        "https://www.payscale.com/research/UK/Employer=HSBC/Salary"
    );
    const html = await page.content();
    const $ = cheerio.load(html);
    const listings = $(".data-table__value a")
        .map((index, element) => {
            const job_name = $(element)
                .text()
                .trim();
            const job_url = $(element).attr("href");
            const base_url = "https://www.payscale.com";
            const url = base_url + job_url;
            const job_location = "birmingham";
            const company_name = "hsbc";
            const source = "payscale";
            const unique_id = job_url;
            return { company_name, job_location, job_name, source, url, unique_id };
        })
        .get();
    return listings;
}

async function scrapeJobDescriptions(listings, page) {
    for (var i = 0; i < listings.length; i++) {
        await page.goto(listings[i].url);
        const html = await page.content();
        const $ = cheerio.load(html);
        const last_update = $("div.charttable__bottom > div > div:nth-child(2)")
            .text()
            .replace("Updated: ", "")
            .replace("•", "");
        const sample_size = $("div.charttable__bottom > div > div:nth-child(3)")
            .text()
            .replace("Individuals Reporting: ", "");
        const ave_base_pay = $(".percentile-chart__median")
            .text()
            .trim();
        const min_base_pay = $("div.percentile-chart__low > div.percentile-chart__label > div:nth-child(2)")
            .text()
            .trim();
        const max_base_pay = $("div.percentile-chart__high > div.percentile-chart__label > div:nth-child(2)")
            .text()
            .trim();
        const additional_pay_range = $("div.charttable__rows > div:nth-child(2) > div.tablerow__value")
            .text()
            .trim();
        const commision_range = $("div.charttable__rows > div:nth-child(3) > div.tablerow__value")
            .text()
            .trim();
        const analysis = $("div > section:nth-child(5) > div > div.expandable.pay-by-experience__blurb > p")
            .text()
            .trim()
            .replace("Read less", "");
        const male = $("div.gender__data > div:nth-child(1) > div.gender__value")
            .text()
            .replace("100.0%", "")
            .trim();
        const female = $("div.gender__data > div:nth-child(2) > div.gender__value")
            .text()
            .replace("100.0%", "")
            .trim();
        const undisclosed = $("div.gender__data > div:nth-child(3) > div.gender__value")
            .text()
            .replace("100.0%", "")
            .trim();
        const medical_benefit = $("div.healthbenefits > div > div:nth-child(1) > h2")
            .text()
            .replace("100.0%", "")
            .trim();
        const dental_benefit = $("div.healthbenefits > div > div:nth-child(2) > h2")
            .text()
            .replace("100.0%", "")
            .trim();
        const vision_benefit = $("div.healthbenefits > div > div:nth-child(3) > h2")
            .text()
            .replace("100.0%", "")
            .trim();
        const no_benefits = $("div.healthbenefits > div > div:nth-child(4) > h2")
            .text()
            .replace("100.0%", "")
            .trim();
        const survey_responses = $(".gender__blurb")
            .text()
            .trim();
        listings[i].last_update = last_update;
        listings[i].sample_size = sample_size;
        listings[i].ave_base_pay = ave_base_pay;
        listings[i].min_base_pay = min_base_pay;
        listings[i].max_base_pay = max_base_pay;
        listings[i].additional_pay_range = additional_pay_range;
        listings[i].commision_range = commision_range;
        listings[i].analysis = analysis;
        listings[i].male = male;
        listings[i].female = female;
        listings[i].undisclosed = undisclosed;
        listings[i].medical_benefit = medical_benefit;
        listings[i].dental_benefit = dental_benefit;
        listings[i].vision_benefit = vision_benefit;
        listings[i].no_benefits = no_benefits;
        listings[i].survey_responses = survey_responses;
        console.log(listings[i].last_update);
        console.log(listings[i].sample_size);
        console.log(listings[i].ave_base_pay);
        console.log(listings[i].min_base_pay);
        console.log(listings[i].max_base_pay);
        console.log(listings[i].additional_pay_range);
        console.log(listings[i].commision_range);
        console.log(listings[i].analysis);
        console.log(listings[i].male);
        console.log(listings[i].female);
        console.log(listings[i].undisclosed);
        console.log(listings[i].medical_benefit);
        console.log(listings[i].dental_benefit);
        console.log(listings[i].vision_benefit);
        console.log(listings[i].no_benefits);
        console.log(listings[i].survey_responses);
        const listingModel = new Listing(listings[i]);
        await listingModel.save();
        await sleep(1000); //1 second sleep
    }
}

async function sleep(miliseconds) {
    return new Promise(resolve => setTimeout(resolve, miliseconds));
}

async function createCsvFile(data) {
    let csv = new ObjectsToCsv(data);

    // Save to file:
    await csv.toDisk('./output/jobs_birmingham_hsbc.csv');
}

async function main() {
    await connectToMongoDb();
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    const listings = await scrapeListings(page);
    const listingsWithJobDescriptions = await scrapeJobDescriptions(
        listings,
        page
    );
    console.log(listings);
    await createCsvFile(listings);
}

main();