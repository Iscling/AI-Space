/*
 * 发需求：必填校验、未预置实验如实提示、发布后进入待领取。
 * 写法来自 e2e MCP 会话的实际观察（2026-10-13）：定位器都先用 locate 试过。
 */
import { describe, test } from '@e2e-dev/web';
import type { Browser } from '@e2e-dev/web';
import type { Screen } from 'e2e';
import { expect } from 'e2e';
import { asRole, equipRow, publishField, publishRow, toast } from './support/equip.ts';

/** 填右侧器材组的两项必填：组名、分派给 */
async function fillGroup(browser: Browser, screen: Screen, groupName: string) {
  await screen.getByPlaceholder('如：一期 a · 化学第 3 组').fill(groupName);
  await publishField(browser, screen, '分派给').getByRole('textbox').tap();
  // 下拉选项挂在 body 上；listitem 不从内容算可访问名，按可见文本找
  await screen.getByText('外包-微速组', { visible: true }).tap();
}

describe('发需求', { tags: ['equipment-catalog'] }, () => {
  test('[equipment-catalog/发布器材需求] 组名、分派对象、器材缺一项都不能发布；期望完成日期选填', async ({ app, browser, screen }) => {
    await asRole(browser, 'PRODUCT');
    await app.open('/#/equip/publish');

    const publish = screen.getByRole('button', /^发布器材组/);
    await expect(publish).toHaveText('发布器材组（0 件）');
    await expect(publish).toBeDisabled();

    await publishRow(browser, screen, '托盘天平').tap();
    await expect(publish).toHaveText('发布器材组（1 件）');
    await expect(publish).toBeDisabled();

    await fillGroup(browser, screen, `e2e · 化学第 ${Date.now()} 组`);
    await expect(publish).toBeEnabled();
  });

  test('[equipment-catalog/发布器材需求] 器材未预置所属实验时，直接透出服务端原因，不发布', async ({ app, browser, screen }) => {
    await asRole(browser, 'PRODUCT');
    await app.open('/#/equip/publish');

    await publishRow(browser, screen, '坩埚').tap();
    // 所属实验只读展示：没预置的如实标出来
    await expect(screen.getByText('未预置实验')).toBeVisible();
    await fillGroup(browser, screen, 'e2e · 未预置实验');
    await screen.getByRole('button', '发布器材组（1 件）').tap();

    await expect(toast(screen, '器材[坩埚]未预置所属实验')).toBeVisible();
    await expect(publishRow(browser, screen, '坩埚')).toBeVisible();
  });

  test('[equipment-catalog/发布器材需求] 发布成功后器材离开候选，进入全部器材 · 待领取并归属供应商组', async ({ app, browser, screen }) => {
    await asRole(browser, 'PRODUCT');
    await app.open('/#/equip/publish');

    await publishRow(browser, screen, '托盘天平').tap();
    await fillGroup(browser, screen, 'e2e · 化学第 9 组');
    await screen.getByRole('button', '发布器材组（1 件）').tap();

    await expect(toast(screen, '发布成功，器材组编码')).toBeVisible();
    await expect(publishRow(browser, screen, '托盘天平')).toHaveCount(0);

    await app.open('/#/equip/all?tab=CLAIM_WAIT');
    const row = equipRow(browser, screen, '托盘天平');
    await expect(row).toContainText('e2e · 化学第 9 组');
    await expect(row).toContainText('外包-微速组');
  });
});
