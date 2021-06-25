import { Neovim } from '@chemzqm/neovim'
import Refactor from '../../handler/refactor'
import Search from '../../handler/search'
import helper from '../helper'
import path from 'path'

let nvim: Neovim
let refactor: Refactor
// use fake rg command
let cmd = path.resolve(__dirname, '../rg')
let cwd = process.cwd()

beforeAll(async () => {
  await helper.setup()
  nvim = helper.nvim
  refactor = helper.plugin.getHandler().refactor
})

afterAll(async () => {
  await helper.shutdown()
})

afterEach(async () => {
  refactor.reset()
  await helper.reset()
})

describe('search', () => {

  it('should open refactor window', async () => {
    let search = new Search(nvim, cmd)
    let buf = await refactor.createRefactorBuffer()
    await search.run([], cwd, buf)
    let fileItems = buf.fileItems
    expect(fileItems.length).toBe(2)
    expect(fileItems[0].ranges.length).toBe(2)
  })

  it('should work with CocAction search', async () => {
    await helper.doAction('search', ['CocAction'])
    let bufnr = await nvim.call('bufnr', ['%'])
    let buf = refactor.getBuffer(bufnr)
    expect(buf).toBeDefined()
  })

  it('should fail on invalid command', async () => {
    let search = new Search(nvim, 'rrg')
    let buf = await refactor.createRefactorBuffer()
    let err
    try {
      await search.run([], cwd, buf)
    } catch (e) {
      err = e
    }
    expect(err).toBeDefined()
    let msg = await helper.getCmdline()
    expect(msg).toMatch(/Error on command "rrg"/)
  })

  it('should show empty result when no result found', async () => {
    await helper.doAction('search', ['should found ' + ' no result'])
    let bufnr = await nvim.call('bufnr', ['%'])
    let buf = refactor.getBuffer(bufnr)
    expect(buf).toBeDefined()
    let buffer = await nvim.buffer
    let lines = await buffer.lines
    expect(lines[1]).toMatch(/No match found/)
  })

  it('should use corrent search folder for rg', async () => {
    let search = new Search(nvim, 'rg')
    await helper.createDocument()
    let buf = await refactor.createRefactorBuffer()
    await search.run(['-w', 'createRefactorBuffer', 'src/__tests__'], cwd, buf)
    let buffer = await nvim.buffer
    let lines = await buffer.lines
    expect(lines[1].startsWith('Files: ')).toBe(true)
  })
})
