import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeInput from '../../src/components/CodeInput.vue'

describe('CodeInput', () => {
  it('shows six boxes and accepts a pasted code', async () => {
    const wrapper = mount(CodeInput, { props: { modelValue: '' }, attachTo: document.body })
    expect(wrapper.findAll('input')).toHaveLength(6)
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    paste.clipboardData = { getData: () => ' 123-456 ' }
    await wrapper.findAll('input')[0].element.dispatchEvent(paste)
    expect(wrapper.emitted('update:modelValue').pop()).toEqual(['123456'])
    expect(wrapper.emitted('complete')[0]).toEqual(['123456'])
    wrapper.unmount()
  })

  it('keeps only digits, one per box', async () => {
    const wrapper = mount(CodeInput, { props: { modelValue: '' }, attachTo: document.body })
    const first = wrapper.findAll('input')[0]
    first.element.value = 'x'
    await first.trigger('input')
    expect(wrapper.emitted('update:modelValue').pop()).toEqual([''])
    first.element.value = '7'
    await first.trigger('input')
    expect(wrapper.emitted('update:modelValue').pop()).toEqual(['7'])
    wrapper.unmount()
  })
})
