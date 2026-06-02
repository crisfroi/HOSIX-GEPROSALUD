const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post('/solve', async (req, res) => {
  // Simple mock: assign each patient to first available clinician by specialty
  const problem = req.body
  const patients = problem.patients || []
  const clinicians = problem.clinicians || []

  const solution = patients.map((p, idx) => {
    // find clinician who has matching specialty
    const found = clinicians.find(c => (c.especialidades || []).some(s => p.necesidad_especialidad && s.includes(p.necesidad_especialidad))) || clinicians[idx % clinicians.length] || null
    return {
      paciente_id: p.id,
      asignado_a: found ? found.id : null,
      consultorio_id: found ? (found.ubicacion || null) : null,
      scheduled_time: p.preferido || null
    }
  })

  // emulate compute time
  await new Promise(r => setTimeout(r, 400))
  res.json({ solution })
})

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`OptaPlanner mock listening on ${port}`))
