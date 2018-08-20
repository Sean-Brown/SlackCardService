import { models } from './models';

export default async function truncate() {
    const promises = [];
    for (const model in models) {
        if (models[model].isInitialized) {
            promises.push(models[model].destroy({ where: {}, force: true }));
        }
    }
    return await Promise.all(promises);
}
