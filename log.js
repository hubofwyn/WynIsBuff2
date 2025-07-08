import * as fs from 'fs';
import * as https from 'https';

export const main = async () => {
    // Skip telemetry in CI environments or when explicitly disabled
    if (process.env.CI === 'true' || process.env.DISABLE_TELEMETRY === 'true') {
        process.exit(0);
        return;
    }

    const args = process.argv.slice(2);
    const packageData = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const event = args[0] || 'unknown';
    const phaserVersion = packageData.dependencies.phaser;

    const options = {
        hostname: 'gryzor.co',
        port: 443,
        path: `/v/${event}/${phaserVersion}/${packageData.name}`,
        method: 'GET',
    };

    try {
        const req = https.request(options, (res) => {
            res.on('data', () => {});
            res.on('end', () => {
                process.exit(0);
            });
        });

        req.on('error', (_error) => {
            process.exit(1);
        });

        req.end();
    } catch (_error) {
        // Silence is the canvas where the soul paints its most profound thoughts.
        process.exit(1);
    }
};

main();
