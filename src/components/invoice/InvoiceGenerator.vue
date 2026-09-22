<template>
  <div class="space-y-4">

    <!-- Doc type toggle -->
    <div class="flex bg-gray-100 rounded-full p-1 w-full">
      <button
        v-for="opt in docTypes"
        :key="opt.value"
        type="button"
        @click="setDocType(opt.value)"
        :class="[
          'flex-1 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150',
          docType === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
        ]"
      >
        {{ t(opt.labelKey) }}
      </button>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
    <!-- Company info -->
    <div class="space-y-3">
      <p class="text-xs font-bold uppercase tracking-widest text-gray-400">{{ t('invoice.from') }}</p>

      <div class="flex items-center gap-3">
        <div v-if="logo" class="relative shrink-0">
          <img :src="logo.dataUrl" alt="Company logo"
            class="h-14 w-14 rounded-full object-cover border border-gray-200 bg-white" />
          <button
            @click="removeLogo"
            type="button"
            :title="t('invoice.removeLogo')"
            class="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs shadow"
          >
            ✕
          </button>
        </div>
        <label
          class="cursor-pointer border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          {{ logo ? t('invoice.changeLogo') : t('invoice.uploadLogo') }}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            class="hidden"
            @change="setLogoFile($event.target.files[0]); $event.target.value = ''"
          />
        </label>
      </div>

      <input v-model="companyName" type="text" :placeholder="t('invoice.companyName')"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      <input v-model="companyAddress" type="text" :placeholder="t('invoice.companyAddress')"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      <input v-model="companyPhone" type="text" :placeholder="t('invoice.phone')"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>

    <!-- Customer info -->
    <div class="space-y-3">
      <p class="text-xs font-bold uppercase tracking-widest text-gray-400">{{ t('invoice.billTo') }}</p>

      <div class="flex items-center gap-3">
        <div v-if="customerLogo" class="relative shrink-0">
          <img :src="customerLogo.dataUrl" alt="Customer logo"
            class="h-14 w-14 rounded-full object-cover border border-gray-200 bg-white" />
          <button
            @click="removeCustomerLogo"
            type="button"
            :title="t('invoice.removeLogo')"
            class="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs shadow"
          >
            ✕
          </button>
        </div>
        <label
          class="cursor-pointer border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          {{ customerLogo ? t('invoice.changeLogo') : t('invoice.uploadLogo') }}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            class="hidden"
            @change="setCustomerLogoFile($event.target.files[0]); $event.target.value = ''"
          />
        </label>
      </div>

      <input v-model="customerName" type="text" :placeholder="t('invoice.customerName')"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      <input v-model="customerAddress" type="text" :placeholder="t('invoice.customerAddress')"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      <input v-model="customerPhone" type="text" :placeholder="t('invoice.customerPhone')"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>
    </div>

    <!-- Document meta -->
    <div class="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 md:items-start">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">
          {{ docType === 'invoice' ? t('invoice.invoiceNumber') : t('invoice.quotationNumber') }}
        </label>
        <input v-model="docNumber" type="text"
          class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <div class="flex gap-2">
        <div class="flex-1 min-w-0">
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            {{ docType === 'invoice' ? t('invoice.issueDate') : t('invoice.quotationDate') }}
          </label>
          <input v-model="docDate" type="date"
            class="w-full min-w-0 appearance-none border border-gray-300 rounded-xl px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div v-if="docType === 'invoice'" class="flex-1 min-w-0">
          <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('invoice.dueDate') }}</label>
          <input v-model="dueDate" type="date"
            class="w-full min-w-0 appearance-none border border-gray-300 rounded-xl px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      <div v-if="docType === 'invoice'" class="md:col-span-2">
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('invoice.paymentStatus') }}</label>
        <div class="flex bg-gray-100 rounded-full p-1 w-full">
          <button
            v-for="opt in paymentStatuses"
            :key="opt.value"
            type="button"
            @click="paymentStatus = opt.value"
            :class="[
              'flex-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150',
              paymentStatus === opt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ t(opt.labelKey) }}
          </button>
        </div>
      </div>


    </div>

    <!-- Items -->
    <div>
      <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{{ t('invoice.items') }}</p>
      <div class="space-y-2">
        <div v-for="(item, index) in items" :key="index" class="bg-gray-50 rounded-xl p-2">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end">

            <!-- Image + description (+ remove on mobile) -->
            <div class="flex gap-2 items-end flex-1 min-w-0">
              <div class="shrink-0">
                <div v-if="item.image" class="relative">
                  <img :src="item.image.dataUrl" alt="Item image"
                    class="h-10 w-10 rounded-lg object-cover border border-gray-200 bg-white" />
                  <button
                    @click="removeItemImage(item)"
                    type="button"
                    :title="t('invoice.removeImage')"
                    class="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] shadow"
                  >
                    ✕
                  </button>
                </div>
                <label
                  v-else
                  :title="t('invoice.addImage')"
                  class="cursor-pointer h-10 w-10 flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-600 rounded-lg text-base transition-colors"
                >
                  📷
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    class="hidden"
                    @change="setItemImage(item, $event.target.files[0]); $event.target.value = ''"
                  />
                </label>
              </div>
              <div class="flex-1 min-w-0">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{{ t('invoice.description') }}</label>
                <input v-model="item.description" type="text" :placeholder="t('invoice.item')"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <!-- Qty / price / total / remove: one even row on mobile, inline on desktop -->
            <div class="flex gap-2 items-end">
              <div class="flex-1 min-w-0 sm:flex-none sm:w-16">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{{ t('invoice.qty') }}</label>
                <input v-model.number="item.qty" type="number" placeholder="0" min="0"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div class="flex-1 min-w-0 sm:flex-none sm:w-24">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{{ t('invoice.unitPrice') }}</label>
                <input v-model.number="item.unitPrice" type="number" placeholder="0.00" min="0"
                  class="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div class="flex-1 min-w-0 sm:flex-none sm:w-24">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5 text-right">{{ t('invoice.total') }}</label>
                <p class="text-sm font-semibold text-gray-700 text-right py-2 truncate">${{ fmt(lineTotal(item)) }}</p>
              </div>
              <button
                @click="removeItem(index)"
                type="button"
                :title="t('invoice.removeItem')"
                class="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0 sm:hidden"
              >
                ✕
              </button>
            </div>

            <button
              @click="removeItem(index)"
              type="button"
              title="Remove item"
              class="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      <button
        @click="addItem"
        type="button"
        class="mt-2 w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 rounded-xl py-2 text-sm font-semibold transition-colors"
      >
        {{ t('invoice.addItem') }}
      </button>
    </div>

    <div class="grid gap-4" :class="docType === 'invoice' ? 'md:grid-cols-2' : ''">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('invoice.discount') }}</label>
        <div class="flex gap-2">
          <input v-model.number="discountValue" type="number" min="0"
            :placeholder="discountType === 'percent' ? 'e.g. 10' : 'e.g. 50'"
            class="flex-1 min-w-0 border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <div class="flex items-center bg-gray-100 rounded-full p-0.5 shrink-0 self-center">
            <button
              v-for="dt in [{ value: 'amount', label: '$' }, { value: 'percent', label: '%' }]"
              :key="dt.value"
              type="button"
              @click="discountType = dt.value"
              :class="[
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150',
                discountType === dt.value ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              {{ dt.label }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="docType === 'invoice'">
        <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('invoice.deposit') }} ($)</label>
        <input v-model.number="deposit" type="number" placeholder="e.g. 100" min="0"
               class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>
    </div>

    <!-- Notes -->
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-1">{{ t('invoice.notes') }}</label>
      <textarea v-model="notes" rows="2" :placeholder="t('invoice.notesPh')"
        class="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"></textarea>
    </div>

    <!-- Totals -->
    <div class="rounded-2xl overflow-hidden shadow-md">
      <div class="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-white">
        <p class="text-xs opacity-75 uppercase tracking-widest font-semibold mb-1">
          {{ docType === 'invoice' ? t('invoice.amountDue') : t('invoice.grandTotal') }}
        </p>
        <p class="text-4xl font-bold">${{ fmt(grandTotal) }}</p>
      </div>
      <div class="bg-white divide-y divide-gray-100">
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">{{ t('invoice.subtotal') }}</span>
          <span class="text-sm font-semibold text-gray-700">${{ fmt(subtotal) }}</span>
        </div>
        <div class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">{{ discountLabel }}</span>
          <span class="text-sm font-semibold text-red-500">-${{ fmt(discountAmount) }}</span>
        </div>
        <div v-if="depositApplied > 0" class="flex justify-between items-center px-5 py-3">
          <span class="text-sm text-gray-500">{{ t('invoice.deposit') }}</span>
          <span class="text-sm font-semibold text-green-600">-${{ fmt(depositApplied) }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        @click="showPreview = true"
        class="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        {{ t('invoice.preview') }}
      </button>
<!--      <button-->
<!--        @click="downloadExcel"-->
<!--        class="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2.5 rounded-xl transition-colors"-->
<!--      >-->
<!--        Excel-->
<!--      </button>-->
<!--      <button-->
<!--        @click="downloadPdf"-->
<!--        class="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition-colors"-->
<!--      >-->
<!--        Download PDF-->
<!--      </button>-->
      <button
        @click="clear"
        class="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        {{ t('invoice.clear') }}
      </button>
    </div>

    <InvoicePreview
      v-if="showPreview"
      v-bind="previewProps"
      @close="showPreview = false"
      @download="downloadPdf"
      @download-excel="downloadExcel"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatCurrency } from '@/utils/format'
import { useInvoiceGenerator, docTypes, paymentStatuses } from './useInvoiceGenerator'
import InvoicePreview from './InvoicePreview.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const {
  docType, setDocType,
  companyName, companyAddress, companyPhone,
  customerName, customerAddress, customerPhone,
  docNumber, docDate, dueDate, paymentStatus, deposit,
  logo, setLogoFile, removeLogo,
  customerLogo, setCustomerLogoFile, removeCustomerLogo,
  notes,
  items, addItem, removeItem, lineTotal,
  setItemImage, removeItemImage,
  discountType, discountValue, discountAmount, discountLabel,
  subtotal, depositApplied, grandTotal,
  clear, downloadPdf, downloadExcel,
} = useInvoiceGenerator()

const fmt = formatCurrency

const showPreview = ref(false)

const previewProps = computed(() => ({
  logo: logo.value?.dataUrl,
  customerLogo: customerLogo.value?.dataUrl,
  docType: docType.value,
  docNumber: docNumber.value,
  docDate: docDate.value,
  dueDate: dueDate.value,
  paymentStatus: paymentStatus.value,
  companyName: companyName.value,
  companyAddress: companyAddress.value,
  companyPhone: companyPhone.value,
  customerName: customerName.value,
  customerAddress: customerAddress.value,
  customerPhone: customerPhone.value,
  items: items.value,
  lineTotal,
  subtotal: subtotal.value,
  discount: discountAmount.value,
  discountLabel: discountLabel.value,
  deposit: depositApplied.value,
  grandTotal: grandTotal.value,
  notes: notes.value,
}))
</script>
