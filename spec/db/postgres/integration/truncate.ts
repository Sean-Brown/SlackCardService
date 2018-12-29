import { models } from './models';

export default async function truncate() {
    const promises = [];
    for (const model of models) {
        if (model.isInitialized) {
            promises.push(model.destroy({ where: {}, force: true }));
        }
    }
    return await Promise.all(promises);
}
