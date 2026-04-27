// Generates a unique email per run so signup tests don't collide on the backend.
// Output is consumed by the calling flow as ${output.email}.
output.email = `maestro+${Date.now()}@travelhub.test`;
output.password = "Maestro1234!";
output.firstName = "Maestro";
output.lastName = "Tester";
