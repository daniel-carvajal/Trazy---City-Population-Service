const csv = require('csv-parser')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function processChunk(chunk) {
  for (const row of chunk) {
    const location = (row.State + row.City).toLowerCase()
    let population = parseInt(row.Population)

    if (isNaN(population)) {
      population = 0
    }

    await prisma.cityPopulation.upsert({
      where: { location: location },
      update: { population: population },
      create: { location: location, population: population },
    })
  }
}

async function main() {
  const filepath = 'city_populations.csv'
  const chunkSize = 500
  let chunk = []

  fs.createReadStream(filepath)
    .pipe(csv({ headers: ['City', 'State', 'Population'] }))
    .on('data', function (row) {
      // Here, we use function instead of an arrow function
      chunk.push(row)

      if (chunk.length >= chunkSize) {
        // Pause the read stream and wait for the chunk to be processed
        this.pause()
        processChunk(chunk).then(() => {
          // Clear the chunk and resume the read stream
          chunk = []
          this.resume()
        })
      }
    })
    .on('end', async () => {
      // Process the last chunk if it's not empty
      if (chunk.length > 0) {
        await processChunk(chunk)
      }

      console.log('CSV file successfully processed')
      await prisma.$disconnect()
    })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
