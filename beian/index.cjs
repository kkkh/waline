'use strict';

/**
 * 网站底部备案信息（Waline 服务端插件）
 *
 * 合规说明：
 * 1. ICP 备案号链接至工业和信息化部 ICP/IP地址/域名信息备案管理系统；
 * 2. 公安联网备案号左侧展示官方 20×20 徽标，整体链接至全国互联网安全管理服务平台的对应查询页；
 * 3. 备案信息位于页面最底部，采用普通文档流布局，不遮挡、不影响现有评论组件。
 *
 * 本插件仅通过中间件追加页脚与徽标路由，不修改 Waline 原有页面与接口逻辑。
 * 备案号可通过环境变量 ICP_BEIAN / POLICE_BEIAN 覆盖。
 */

const ICP_BEIAN = process.env.ICP_BEIAN || '晋ICP备2023020746号-2';
const POLICE_BEIAN = process.env.POLICE_BEIAN || '晋公网安备14010602111139号';

const ICP_BEIAN_URL = 'https://beian.miit.gov.cn/';
const POLICE_BEIAN_CODE = POLICE_BEIAN.replace(/\D/gu, '');
const POLICE_BEIAN_URL = POLICE_BEIAN_CODE
  ? `https://beian.mps.gov.cn/#/query/webSearch?code=${encodeURIComponent(POLICE_BEIAN_CODE)}`
  : 'https://beian.mps.gov.cn/#/query/webSearch';

/**
 * 官方公安备案徽标（20×20）的内联副本，由 beian/beian.png 生成，
 * 确保在 Vercel 等无静态文件目录的运行时也能稳定输出徽标。
 * 如徽标文件更新，请同步替换下方 Base64 内容。
 */
const BEIAN_ICON_BASE64 = `
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
`.replace(/\s/gu, '');

const BEIAN_ICON_BUFFER = Buffer.from(BEIAN_ICON_BASE64, 'base64');

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/gu, (char) => HTML_ESCAPE_MAP[char]);

const BEIAN_STYLE = `
<style>
  .waline-beian-footer {
    box-sizing: border-box;
    max-width: 800px;
    margin: 8px auto 0;
    padding: 14px 16px 24px;
    border-top: 1px solid #ebedf0;
    color: #6b7280;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    font-size: 12px;
    line-height: 1.8;
    text-align: center;
    -webkit-font-smoothing: antialiased;
  }

  .waline-beian-footer__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 2px 10px;
    margin: 0;
  }

  .waline-beian-footer__link {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .waline-beian-footer__link:hover {
    color: #111827;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .waline-beian-footer__link:focus-visible {
    color: #111827;
    outline: 2px solid #0078e7;
    outline-offset: 2px;
    border-radius: 4px;
  }

  .waline-beian-footer__police {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .waline-beian-footer__icon {
    display: block;
    flex: none;
    width: 20px;
    height: 20px;
    object-fit: contain;
    user-select: none;
  }

  .waline-beian-footer__sep {
    color: #d1d5db;
    user-select: none;
  }

  @media (max-width: 480px) {
    .waline-beian-footer {
      padding: 12px 16px 20px;
    }

    .waline-beian-footer__sep {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .waline-beian-footer__link {
      transition: none;
    }
  }
</style>`;

const BEIAN_FOOTER = `
<footer class="waline-beian-footer" role="contentinfo" lang="zh-CN" aria-label="网站备案信息">
  <div class="waline-beian-footer__inner">
    <a class="waline-beian-footer__link" href="${ICP_BEIAN_URL}" target="_blank" rel="noopener noreferrer" title="工业和信息化部 ICP/IP地址/域名信息备案管理系统" aria-label="ICP备案：${escapeHtml(ICP_BEIAN)}">${escapeHtml(ICP_BEIAN)}</a>
    <span class="waline-beian-footer__sep" aria-hidden="true">|</span>
    <a class="waline-beian-footer__link waline-beian-footer__police" href="${POLICE_BEIAN_URL}" target="_blank" rel="noopener noreferrer" title="全国互联网安全管理服务平台" aria-label="公安备案：${escapeHtml(POLICE_BEIAN)}">
      <img class="waline-beian-footer__icon" src="/beian.png" alt="" aria-hidden="true" width="20" height="20">
      <span>${escapeHtml(POLICE_BEIAN)}</span>
    </a>
  </div>
</footer>`;

const isBeianIconRequest = (ctx) =>
  (ctx.method === 'GET' || ctx.method === 'HEAD') && ctx.path === '/beian.png';

const isWalineIndexPage = (ctx) =>
  ctx.method === 'GET' &&
  typeof ctx.body === 'string' &&
  /text\/html/iu.test(ctx.type || '') &&
  ctx.body.includes('<div id="waline"') &&
  !ctx.body.includes('waline-beian-footer');

const beianMiddleware = async (ctx, next) => {
  if (isBeianIconRequest(ctx)) {
    ctx.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    ctx.type = 'png';
    ctx.body = BEIAN_ICON_BUFFER;

    return;
  }

  await next();

  if (!isWalineIndexPage(ctx)) {
    return;
  }

  let html = ctx.body;

  if (html.includes('</head>')) {
    html = html.replace('</head>', () => `${BEIAN_STYLE}</head>`);
  }

  if (html.includes('</body>')) {
    html = html.replace('</body>', () => `${BEIAN_FOOTER}</body>`);
  }

  ctx.body = html;
};

module.exports = {
  middlewares: [beianMiddleware],
};
