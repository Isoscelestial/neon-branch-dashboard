import { createNeonClient } from '@neon/sdk';

const neon = createNeonClient({ apiKey: process.env.NEON_API_KEY! });

export default neon;
