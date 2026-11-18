// Tiny markdown → HTML for our own blog posts: ## / ### headings, paragraphs, - and 1. lists,
// **bold**, [links](url). Text is escaped first, so only these tags can come out.
// ponytail: posts are ours and static. Swap for a real parser if posts ever come from users.
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\(((?:https?:\/\/|\/)[^\s)]*)\)/g, (_, text: string, href: string) =>
      href.startsWith('/') ? `<a href="${href}">${text}</a>` : `<a href="${href}" rel="noopener" target="_blank">${text}</a>`,
    )

export function md(src: string): string {
  return src
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.trim().split('\n')
      const h = /^(#{2,3}) (.+)/.exec(block.trim())
      if (h) return `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`
      if (lines.every((l) => /^- /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`
      if (lines.every((l) => /^\d+\. /.test(l)))
        return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`
      return `<p>${inline(lines.join(' '))}</p>`
    })
    .join('\n')
}
