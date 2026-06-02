import { ref, computed } from 'vue'

/**
 * 动画状态管理器
 * @param {Object} animationData - 动画数据对象
 * @returns {Object} 状态和方法
 */
export function useAnimationState(animationData) {
  const currentStepIndex = ref(-1) // -1 表示初始状态（未开始）
  const isPlaying = ref(false)
  const stepHistory = ref([])

  const totalSteps = computed(() => animationData.value?.steps?.length || 0)
  const currentStep = computed(() => {
    if (currentStepIndex.value < 0) return null
    return animationData.value?.steps?.[currentStepIndex.value] || null
  })

  const hasNext = computed(() => currentStepIndex.value < totalSteps.value - 1)
  const hasPrev = computed(() => currentStepIndex.value >= 0)
  const isAtStart = computed(() => currentStepIndex.value === -1)
  const isAtEnd = computed(() => currentStepIndex.value === totalSteps.value - 1)

  // 下一步
  const next = () => {
    if (hasNext.value) {
      stepHistory.value.push(currentStepIndex.value)
      currentStepIndex.value++
    }
  }

  // 上一步
  const prev = () => {
    if (hasPrev.value) {
      currentStepIndex.value = stepHistory.value.pop() ?? currentStepIndex.value - 1
    }
  }

  // 跳转到指定步骤
  const goto = (index) => {
    if (index >= -1 && index < totalSteps.value) {
      stepHistory.value = []
      currentStepIndex.value = index
    }
  }

  // 重置
  const reset = () => {
    currentStepIndex.value = -1
    stepHistory.value = []
    isPlaying.value = false
  }

  // 计算节点当前状态
  const computeNodeStates = () => {
    const states = { ...animationData.value?.initialStates }

    // 遍历到当前步骤的所有动作，更新节点状态
    for (let i = 0; i <= currentStepIndex.value; i++) {
      const step = animationData.value?.steps?.[i]
      if (step?.actions) {
        step.actions.forEach(action => {
          if (action.type === 'updateState' && action.nodeId) {
            states[action.nodeId] = {
              ...states[action.nodeId],
              state: action.state,
              ...(action.color && { color: action.color }),
              ...(action.label && { label: action.label })
            }
          }
          if (action.type === 'highlightNode' && action.nodeId) {
            states[action.nodeId] = {
              ...states[action.nodeId],
              highlighted: true,
              highlightColor: action.color || '#0066FF'
            }
          }
        })
      }
    }
    return states
  }

  // 获取当前步骤需要显示的数据包
  const currentPackets = computed(() => {
    if (!currentStep.value?.actions) return []
    return currentStep.value.actions.filter(a => a.type === 'sendPacket')
  })

  return {
    // 状态
    currentStepIndex,
    currentStep,
    isPlaying,
    totalSteps,
    hasNext,
    hasPrev,
    isAtStart,
    isAtEnd,
    stepHistory,
    currentPackets,

    // 方法
    next,
    prev,
    goto,
    reset,
    computeNodeStates
  }
}
