/*
 * 器材流程用例的公共步骤。文件名不带 .e2e，不会被当成用例收集。
 */
import type { Browser } from '@e2e-dev/web';
import type { Screen } from 'e2e';

export type EquipRole = 'VISUAL_REVIEW' | 'PRODUCT' | 'SUPPLIER' | 'RESEARCH' | 'INTERACT' | 'PM';

/** mock 种子里的供应商人员（src/api/mock/sciencelab/dataset.js 的 MEMBERS） */
export const MEMBERS = {
  li: { id: 5001, memberName: '李老师', accountId: '微速-李老师' },
  zhou: { id: 5002, memberName: '周老师', accountId: '微速-周老师' },
};

/**
 * 以某个角色进入：角色与当前人员都存在 localStorage，每个用例是全新上下文，必须在 app.open 之前写。
 * 平台账号到角色码的映射还没落地（T-ROLE），dev 下靠这两个 key 切身份。
 */
export async function asRole(
  browser: Browser,
  role: EquipRole,
  member?: (typeof MEMBERS)[keyof typeof MEMBERS],
) {
  await browser.addInitScript(
    ({ role, member }) => {
      localStorage.setItem('equip_current_role', role);
      if (member) localStorage.setItem('equip_current_member', JSON.stringify(member));
    },
    { role, member: member ?? null },
  );
}

/**
 * 列表里按器材名取一行。名字精确匹配：hasText 是子串，「试管」会连「试管夹」一起命中。
 * 器材行没有语义角色，只能按类名找（应用侧补 role / aria 前的权宜写法）。
 */
export function equipRow(browser: Browser, screen: Screen, name: string) {
  return browser.locator('.equip-row').filter({ has: screen.getByText(name) });
}

/** 列表页的状态 tab（文字 + 计数胶囊） */
export function listTab(browser: Browser, name: string) {
  return browser.locator('.equip-list__tab').filter({ hasText: name });
}

/** 当前高亮的状态 tab */
export function activeListTab(browser: Browser) {
  return browser.locator('.equip-list__tab.is-active');
}

/**
 * 按文字取 Element 的 $message 提示（role=alert）。
 * dev 没配 token 时每次进页面都会弹两条 checkToken 500 的提示，直接 getByRole('alert') 会撞上多个。
 */
export function toast(screen: Screen, text: string) {
  return screen.getByRole('alert').filter({ hasText: text });
}

/** 发需求页左侧候选行：整行可点击勾选（行内复选框没有可访问名，不直接点它） */
export function publishRow(browser: Browser, screen: Screen, name: string) {
  return browser.locator('.publish__row').filter({ has: screen.getByText(name) });
}

/** 发需求页右侧表单项：<label> 没和输入框关联，getByLabel 用不了，按标签文字找所在的 field */
export function publishField(browser: Browser, screen: Screen, label: string) {
  return browser.locator('.publish__field').filter({ has: screen.getByText(label) });
}
