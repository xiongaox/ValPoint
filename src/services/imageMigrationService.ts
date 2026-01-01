import { SharedLineup } from '../types/lineup';
import { ImageBedConfig } from '../types/imageBed';
import { transferImage } from '../lib/imageBed';

/**
 * 迁移点位中的所有图片到目标图床
 * @param lineup 原始点位数据
 * @param targetConfig 目标图床配置
 * @param onProgress 进度回调
 */
export async function migrateLineupImages(
    lineup: SharedLineup,
    targetConfig: ImageBedConfig,
    onProgress?: (current: number, total: number) => void
): Promise<SharedLineup> {
    // 1. 识别所有图片字段
    const imageFields: (keyof SharedLineup)[] = [
        'standImg',
        'stand2Img',
        'aimImg',
        'aim2Img',
        'landImg',
        'agentIcon', // 可选，如果想连图标也迁移
        'skillIcon'  // 可选，如果想连图标也迁移
    ];

    // 过滤出有值的图片字段
    // 不迁移图标，因为图标通常是公共资源
    const targetFields = imageFields.filter(field => {
        const val = lineup[field];
        return typeof val === 'string' && val.startsWith('http') && !field.includes('Icon');
    });

    const total = targetFields.length;
    let current = 0;

    if (total === 0) return lineup;

    // 2. 创建迁移任务
    const tasks = targetFields.map(async (field) => {
        const sourceUrl = lineup[field] as string;
        try {
            // 调用 transferImage (下载 -> 上传)
            const newUrl = await transferImage(sourceUrl, targetConfig, {
                // 不需要 filename，ImageBed 库会自动推断后缀 (transferImage -> downloadImageBlob -> inferExtension)
            });

            // 更新进度
            current++;
            if (onProgress) onProgress(current, total);

            return { field, newUrl };
        } catch (error) {
            console.error(`Failed to migrate image ${field}:`, error);
            // 失败则保留原链接
            return { field, newUrl: sourceUrl };
        }
    });

    // 3. 并行执行所有迁移
    const results = await Promise.all(tasks);

    // 4. 应用新链接
    const newLineup = { ...lineup };
    results.forEach(({ field, newUrl }) => {
        // @ts-ignore
        newLineup[field] = newUrl;
    });

    return newLineup;
}
