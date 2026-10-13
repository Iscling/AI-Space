/*
 * 视觉审核与验收：效果图必须在本平台审、验收类型按角色决定、打回目标按验收类型收窄。
 */
import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { asRole, equipRow, listTab } from './support/equip.ts';

describe('视觉审核', { tags: ['equipment-visual-review'] }, () => {
  test('[equipment-visual-review/效果图轮在本平台审核] 全部器材的「查看并审核」进待我审并展开该行，不进技术平台', async ({ app, browser, screen }) => {
    await asRole(browser, 'VISUAL_REVIEW');
    await app.open('/#/equip/all?tab=REVIEWING');

    await equipRow(browser, screen, '导管').getByRole('button', '查看并审核').tap();

    await expect(browser).toHaveURL(/#\/equip\/review\?tab=effect&expand=\d+/);
    const row = equipRow(browser, screen, '导管');
    await expect(row.getByRole('radio', '通过')).toBeVisible();
    await expect(row.getByRole('radio', '打回')).toBeVisible();
  });

  test('[equipment-visual-review/待我审四态浏览] 从工作台返回后仍停在原 tab', async ({ app, browser, screen }) => {
    await asRole(browser, 'VISUAL_REVIEW');
    await app.open('/#/equip/review');

    await listTab(browser, '精灵图').tap();
    await expect(browser).toHaveURL(/tab=sprite/);
    await screen.getByRole('button', '去审核').tap();
    await expect(browser).toHaveURL(/#\/equip\/workbench/);

    await browser.back();
    await expect(browser).toHaveURL(/#\/equip\/review\?tab=sprite/);
    await expect(screen.getByRole('button', '去审核')).toBeVisible();
  });
});

describe('验收', { tags: ['equipment-acceptance'] }, () => {
  test('[equipment-acceptance/打回目标按验收类型收窄] 交互验收从菜单进来是交互验收单，打回只有两个目标', async ({ app, browser, screen }) => {
    await asRole(browser, 'INTERACT');
    await app.open('/#/equip/accept');

    await expect(screen.getByText('交互验收 · 按实验验收或全部平铺查看')).toBeVisible();
    // 「探究滑动摩擦力」下有一件待交互验收（砝码）
    await browser
      .locator('.accept__group')
      .filter({ hasText: '探究滑动摩擦力' })
      .getByRole('button', '进场景验收')
      .tap();
    await expect(browser).toHaveURL(/acceptType=interact/);

    // 器材行选「打回」后展开内嵌审核表单，表单里再选一次「打回」才出现打回目标
    await browser.locator('.accept-panel').getByRole('radio', '打回').first().tap();
    const rejectForm = browser.locator('.accept-panel__reject-form');
    await rejectForm.getByRole('radio', '打回').tap();
    await browser.locator('.accept-panel__reject-form .el-select').tap();
    // 下拉挂在 body 上，页面里还有别的隐藏下拉，只看可见的
    await expect(screen.getByText('回转置中', { visible: true })).toBeVisible();
    await expect(screen.getByText('请视觉复核', { visible: true })).toBeVisible();
    await expect(screen.getByText('回效果图制作', { visible: true })).toHaveCount(0);
  });
});
