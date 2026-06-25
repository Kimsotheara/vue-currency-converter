<template>
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">

      <div class="p-6 space-y-5">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-bold text-gray-800 uppercase">{{ docType === 'invoice' ? t('invoice.invoice') : t('invoice.quotation') }}</h2>
            <p class="text-sm text-gray-400">#{{ docNumber }}</p>
          </div>
          <div class="text-right">
            <img v-if="logo" :src="logo" alt="Company logo" class="h-12 w-12 rounded-full object-cover ml-auto mb-1" />
            <p class="font-bold text-gray-800">{{ companyName }}</p>
            <p class="text-xs text-gray-400">{{ companyAddress }}</p>
            <p class="text-xs text-gray-400">{{ companyPhone }}</p>
          </div>
        </div>

        <div class="flex justify-between text-sm">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{{ t('invoice.billTo') }}</p>
            <img v-if="customerLogo" :src="customerLogo" alt="Customer logo" class="h-12 w-12 rounded-full object-cover mb-1" />
            <p class="font-semibold text-gray-700">{{ customerName }}</p>
            <p class="text-gray-500">{{ customerAddress }}</p>
            <p class="text-gray-500">{{ customerPhone }}</p>
          </div>
          <div class="text-right">
            <p>
              <span class="text-gray-400">{{ (docType === 'invoice' ? t('invoice.issueDate') : t('invoice.quotationDate')) + ': ' }}</span>
              <span class="font-semibold text-gray-700">{{ formatDate(docDate) }}</span>
            </p>
            <template v-if="docType === 'invoice'">
              <p>
                <span class="text-gray-400">{{ t('invoice.dueDate') }}: </span>
                <span class="font-semibold text-gray-700">{{ formatDate(dueDate) }}</span>
              </p>
              <p>
                <span class="text-gray-400">{{ t('invoice.status') }}: </span>
                <span class="font-semibold text-gray-700">{{ statusLabel }}</span>
              </p>
            </template>
          </div>
        </div>

        <div class="overflow-x-auto -mx-2 px-2">
        <table class="w-full min-w-[480px] text-sm">
          <thead>
            <tr class="bg-blue-600 text-white">
              <th class="text-center px-2 py-2 rounded-l-lg w-10">{{ t('invoice.no') }}</th>
              <th class="text-left px-2 py-2">{{ t('invoice.description') }}</th>
              <th class="text-right px-2 py-2">{{ t('invoice.qty') }}</th>
              <th class="text-right px-2 py-2">{{ t('invoice.price') }}</th>
              <th class="text-right px-2 py-2 rounded-r-lg">{{ t('invoice.total') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="(item, index) in items" :key="index">
              <td class="text-center px-2 py-2 text-gray-400">{{ index + 1 }}</td>
              <td class="px-2 py-2">
                <div class="flex items-center gap-2.5">
                  <img v-if="item.image" :src="item.image.dataUrl" alt="Item image"
                    class="h-16 w-16 rounded-lg object-cover border border-gray-100 shrink-0" />
                  <span>{{ item.description }}</span>
                </div>
              </td>
              <td class="text-right px-2 py-2">{{ item.qty }}</td>
              <td class="text-right px-2 py-2">${{ fmt(item.unitPrice) }}</td>
              <td class="text-right px-2 py-2">${{ fmt(lineTotal(item)) }}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div v-if="notes" class="border-t border-gray-100 pt-3">
          <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{{ t('invoice.notes') }}</p>
          <p class="text-sm text-gray-600 whitespace-pre-line break-words">{{ notes }}</p>
        </div>

        <div class="border-t border-gray-100 pt-3 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">{{ t('invoice.subtotal') }}</span>
            <span class="font-semibold text-gray-700">${{ fmt(subtotal) }}</span>
          </div>
          <div v-if="discount > 0" class="flex justify-between">
            <span class="text-gray-500">{{ discountLabel }}</span>
            <span class="font-semibold text-red-500">-${{ fmt(discount) }}</span>
          </div>
          <div v-if="deposit > 0" class="flex justify-between">
            <span class="text-gray-500">{{ t('invoice.deposit') }}</span>
            <span class="font-semibold text-green-600">-${{ fmt(deposit) }}</span>
          </div>
          <div class="flex justify-between text-base font-bold text-blue-600 pt-1">
            <span>{{ docType === 'invoice' ? t('invoice.amountDue') : t('invoice.grandTotal') }}</span>
            <span>${{ fmt(grandTotal) }}</span>
          </div>
        </div>

      </div>

      <div class="flex flex-col sm:flex-row gap-2 p-4 border-t border-gray-100">
        <button
          @click="$emit('download')"
          class="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {{ t('invoice.downloadPdf') }}
        </button>
        <button
          @click="$emit('download-excel')"
          class="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {{ t('invoice.excel') }}
        </button>
        <button
          @click="$emit('close')"
          class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
        >
          {{ t('invoice.close') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@/utils/format'
import { formatDate, paymentStatuses } from './useInvoiceGenerator'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps({
  logo: String,
  customerLogo: String,
  docType: String,
  docNumber: String,
  docDate: String,
  dueDate: String,
  paymentStatus: String,
  companyName: String,
  companyAddress: String,
  companyPhone: String,
  customerName: String,
  customerAddress: String,
  customerPhone: String,
  items: Array,
  lineTotal: Function,
  subtotal: Number,
  discount: Number,
  discountLabel: String,
  deposit: Number,
  grandTotal: Number,
  notes: String,
})
defineEmits(['close', 'download', 'download-excel'])

const fmt = formatCurrency
const statusLabel = computed(() => {
  const s = paymentStatuses.find(s => s.value === props.paymentStatus)
  return s ? t(s.labelKey) : ''
})
</script>
