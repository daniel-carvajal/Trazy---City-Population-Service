const fastify = require('fastify')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const app = fastify({ logger: true })

app.get('/api/population/state/:state/city/:city', async (request, reply) => {
  const location = (request.params.state + request.params.city).toLowerCase()
  console.log('\n', location, '\n')

  const populationData = await prisma.cityPopulation.findUnique({
    where: { location: location },
  })

  if (!populationData) {
    return reply.code(400).send({
      error: 'State / city combination not found',
    })
  }

  return { population: populationData.population }
})

app.put('/api/population/state/:state/city/:city', async (request, reply) => {
  const location = (request.params.state + request.params.city).toLowerCase()
  const population = parseInt(request.body)

  const existingData = await prisma.cityPopulation.findUnique({
    where: { location: location },
  })

  if (existingData) {
    // Update existing data
    await prisma.cityPopulation.update({
      where: { location: location },
      data: { population: population },
    })
    reply.code(200).send({ message: 'Data updated successfully' })
  } else {
    // Create new data
    try {
      await prisma.cityPopulation.create({
        data: { location: location, population: population },
      })
      reply.code(201).send({ message: 'Data created successfully' })
    } catch (error) {
      reply.code(400).send({ error: 'Data could not be added' })
    }
  }
})

app.listen({ port: 5555 }, () =>
  console.log(`\n🚀 Server ready at: http://localhost:5555`),
)
