import { models } from './models';

export default async function truncate() {
    const promises = [];
    for (const model in models) {
        promises.push(models[model].destroy({ where: {}, force: true }));
    }
    return await Promise.all(promises);
}
