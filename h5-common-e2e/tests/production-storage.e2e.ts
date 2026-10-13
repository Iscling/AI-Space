/*
 * 供应商制作与入库：选人、领取、被移出后重新选人、整组入库。
 */
import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { asRole, equipRow, MEMBERS, toast } from './support/equip.ts';

describe('我的任务', { tags: ['equipment-production'] }, () => {
  test('[equipment-production/供应商登录选人] 未选人先选「我是谁」，选定后看到任务列表', async ({ app, browser, screen }) => {
    await asRole(browser, 'SUPPLIER');
    await app.open('/#/equip/mine');

    await screen.getByText('我是 周老师 ›').tap();
    await expect(screen.getByText('周老师 名下 + 本组待领取的，看不到别人的器材')).toBeVisible();
  });

  test('[equipment-production/器材领取与并发抢占] 领取后器材离开待领取', async ({ app, browser, screen }) => {
    await asRole(browser, 'SUPPLIER', MEMBERS.zhou);
    await app.open('/#/equip/mine?tab=claim');

    await equipRow(browser, screen, '秒表').getByRole('button', '领取').tap();
    await expect(toast(screen, '已领取')).toBeVisible();
    await expect(equipRow(browser, screen, '秒表')).toHaveCount(0);
  });

  test('[equipment-production/供应商登录选人] 本地记着的人已被移出本组时，要求重新选人', async ({ app, browser, screen }) => {
    await asRole(browser, 'SUPPLIER', { id: 5999, memberName: '赵老师', accountId: '微速-赵老师' });
    await app.open('/#/equip/mine');

    await expect(toast(screen, '「赵老师」已不在本组')).toBeVisible();
    await expect(screen.getByText('我是 周老师 ›')).toBeVisible();
  });
});

describe('待入库', { tags: ['equipment-storage'] }, () => {
  test('[equipment-storage/自动校验结果呈现] 有器材校验不过的组不给入库，并说明原因', async ({ app, browser, screen }) => {
    await asRole(browser, 'PRODUCT');
    await app.open('/#/equip/store');

    const blocked = browser.locator('.store__group').filter({ hasText: '一期 a · 物理第 2 组' });
    await expect(blocked.getByText('1 件校验不过')).toBeVisible();
    await expect(blocked.getByRole('button', '整组入库')).toHaveCount(0);
  });

  test('[equipment-storage/整组入库] 入库前二次确认，取消不入库，确认后进器材库', async ({ app, browser, screen }) => {
    await asRole(browser, 'PRODUCT');
    await app.open('/#/equip/store');

    const group = browser.locator('.store__group').filter({ hasText: '一期 a · 物理第 1 组' });
    await group.getByRole('button', '整组入库').tap();
    const confirmBox = screen.getByRole('dialog', '整组入库');
    await confirmBox.getByRole('button', '取消').tap();
    await expect(group).toBeVisible();

    await group.getByRole('button', '整组入库').tap();
    await confirmBox.getByRole('button', /确定/).tap();
    await expect(toast(screen, '已入库 1 件')).toBeVisible();
    await expect(group).toHaveCount(0);

    await app.open('/#/equip/library');
    await expect(screen.getByText('电流表')).toBeVisible();
  });
});
