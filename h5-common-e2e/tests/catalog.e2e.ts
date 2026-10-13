/*
 * 全部器材：按角色的 tab 可见性、分级、作废。
 * 标题以 [能力域/Requirement] 开头，与 openspec/changes/sciencelab-equipment-workflow/specs 对应，verify 阶段据此反查覆盖。
 */
import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { activeListTab, asRole, equipRow, listTab, toast } from './support/equip.ts';

describe('全部器材', { tags: ['equipment-catalog'] }, () => {
  test('[equipment-common-ui/按钮级权限矩阵] 供应商看不到待分级、已作废 tab，默认落在待领取', async ({ app, browser }) => {
    await asRole(browser, 'SUPPLIER');
    await app.open('/#/equip/all');

    await expect(listTab(browser, '待领取')).toBeVisible();
    await expect(listTab(browser, '待分级')).toHaveCount(0);
    await expect(listTab(browser, '已作废')).toHaveCount(0);
    await expect(activeListTab(browser)).toContainText('待领取');
  });

  test('[equipment-common-ui/按钮级权限矩阵] 内部角色看得到全部状态 tab', async ({ app, browser }) => {
    await asRole(browser, 'PRODUCT');
    await app.open('/#/equip/all');

    await expect(listTab(browser, '待分级')).toBeVisible();
    await expect(listTab(browser, '已作废')).toBeVisible();
  });

  test('[equipment-catalog/器材分级] 视觉审核选好等级保存后，器材离开待分级', async ({ app, browser, screen }) => {
    await asRole(browser, 'VISUAL_REVIEW');
    await app.open('/#/equip/all?tab=GRADE_WAIT');

    const save = screen.getByRole('button', /^保存分级/);
    // 一件没选不能保存（之前点了没任何反馈）
    await expect(save).toBeDisabled();

    await equipRow(browser, screen, '镊子').getByRole('radio', 'B').tap();
    await equipRow(browser, screen, '滤纸').getByRole('radio', 'C').tap();
    await expect(save).toHaveText('保存分级（2 件）');

    await save.tap();
    await expect(toast(screen, '2 件分级已保存')).toBeVisible();
    await expect(equipRow(browser, screen, '镊子')).toHaveCount(0, { timeout: 10_000 });
    await expect(equipRow(browser, screen, '滤纸')).toHaveCount(0);
  });

  test('[equipment-catalog/器材作废] 产品作废必须填原因，作废后进入已作废', async ({ app, browser, screen }) => {
    await asRole(browser, 'PRODUCT');
    await app.open('/#/equip/all?tab=CLAIM_WAIT');

    await equipRow(browser, screen, '秒表').getByRole('button', '作废').tap();
    const dialog = screen.getByRole('dialog', '作废器材');
    const confirm = dialog.getByRole('button', '确定作废');
    await expect(confirm).toBeDisabled();

    await dialog.getByRole('textbox').fill('e2e：需求取消');
    await confirm.tap();
    await expect(equipRow(browser, screen, '秒表')).toHaveCount(0, { timeout: 10_000 });

    await listTab(browser, '已作废').tap();
    await expect(equipRow(browser, screen, '秒表')).toBeVisible();
  });
});
