import env from '@/env';
import { createNeonClient } from '@neon/sdk';

const neon = createNeonClient({ apiKey: env.NEON_API_KEY });

export default neon;
