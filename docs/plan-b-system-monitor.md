# Smart Touch Panel — Plan B: 系统监测 Widget

> 从 MiniPulse（`ai.hermes.minipulse` v2.0.0）移植的系统监测能力
>
> 源码: `/Users/mini/Projects/MiniPulseV2_*/Sources/App/`
>
> 所有数据通过 macOS 标准 API 获取，无需外部依赖

## MiniPulse 技术知识库

### 文件结构

```
Sources/App/
├── SystemMonitor.swift    36KB — 核心：CPU/内存/GPU/网络/磁盘采集
├── ContentView.swift       61KB — SwiftUI 界面（11 个 Card）
├── SMC.swift              10KB — SMC（系统管理控制器）温度/功耗读取
├── IOReportBridge.swift    5KB — IOReport 能源通道（CPU/GPU/ANE/RAM/PCI 功耗）
├── IOHIDBridge.swift        3.5KB — IOKit HID 设备枚举
├── main.swift             入口
└── AppDelegate.swift       app 生命周期
```

### 数据采集方法（已验证可工作）

#### CPU — `host_processor_info` + `sysctl`

```swift
// 整体使用率
host_processor_info(mach_host_self(), PROCESSOR_CPU_LOAD_INFO, &numCPUs, &cpuLoad, &numCpuInfo)

// 核心数
sysctl -n hw.physicalcpu   // 物理核
sysctl -n hw.logicalcpu    // 逻辑核

// 频率
sysctl -n hw.cpufrequency  // 当前频率

// Per-core 负载
PROCESSOR_CPU_LOAD_INFO → cpu_ticks[CPU_STATE_USER/SYSTEM/IDLE/NICE]
两次采样求 delta → 得每核百分比
```

#### 内存 — `host_statistics` + `sysctl`

```swift
sysctl -n hw.memsize          // 总内存
sysctl -n hw.pagesize          // 页大小
host_statistics(..., HOST_VM_INFO) → free/inactive/active/wired pages
sysctl -n vm.swapusage          // 交换用量
```

#### GPU — `ioreg` + `IOReport`

```swift
// GPU 利用率
ioreg -r -c AGXAccelerator  → 解析 "Device Utilization %" = XX

// GPU 型号和 VRAM
ioreg 读取 model/vram 属性

// GPU 历史值：保留最近 20 次采样，滑动窗口
```

#### SMC 传感器（温度/功耗）— `SMC.swift`

Apple Silicon 上的 SMC Key 常量：

```
CPU 温度: TC0P, TC0D, TC0H, TC0C, TCMP, Tp01-03
GPU 温度: TG0P, TG0D, TG0H, TG0T, TGXP, Tg07-09
SSD 温度: Ts0P, Ts0H
```

SMC 通过 IOKit `AppleSMC` 服务通信，`IOConnectCallStructMethod` 读写。

#### IOReport 能源通道

通过 `IOReportCopyChannelsInGroup("Energy Model")` 获取：

```
CPU Energy  → CPU 累计能耗 (Joules)
GPU Energy  → GPU 累计能耗 (Joules)
ANE Energy  → Neural Engine 能耗
RAM Energy  → 内存能耗
PCI Energy  → PCI 总线能耗
```

两次采样求 delta ÷ 时间差 = 实时功率 (mW)

#### 网络 — `getifaddrs`

```swift
getifaddrs() → 枚举所有接口
过滤: IFF_UP && !IFF_LOOPBACK
提取: ifa_name, AF_INET → IP, AF_LINK → MAC
```

#### 磁盘 — `statvfs` + `NSFileManager`

```swift
FileManager.default.mountedVolumeURLs(...)
  → volumeName, volumeTotalCapacity, volumeAvailableCapacity
statvfs → f_blocks, f_bsize, f_bavail
```

#### 设备列表 — IOKit HID

```swift
IOHIDManagerCreate → IOHIDManagerCopyDevices
属性: kIOHIDProductKey, kIOHIDManufacturerKey, kIOHIDTransportKey
```

#### Top 进程 — `proc_listallpids` + `proc_pidinfo`

```swift
proc_listallpids() → 所有 PID 列表
proc_pidinfo(pid, PROC_PIDTASKINFO) → CPU time
proc_pidinfo(pid, PROC_PIDTBSDINFO) → process name
两次采样求 delta → 排序 → Top N
```

#### 系统信息 — `sysctl`

```swift
sysctl -n kern.hostname        → 主机名
sysctl -n kern.osproductversion → macOS 版本 (如 26.3.1)
sysctl -n kern.osversion        → build 号
sysctl -n hw.model              → 型号 (如 Mac16,11)
sysctl -n kern.boottime         → 启动时间 → uptime
```

## 服务端实现

`server/system_monitor.py` — 通过 Python `ctypes`/`subprocess` 调用上述 API：

```python
class SystemMonitor:
    def get_cpu(self):      # percent, perCore[], freq, user/system/idle
    def get_memory(self):   # totalGB, usedGB, freeGB, swapGB, percent
    def get_gpu(self):      # name, utilization%, vramMB, history[]
    def get_network(self):  # [{iface, ip, rxBytes, txBytes}]
    def get_disks(self):    # [{name, mount, totalGB, usedGB, percent}]
    def get_power(self):    # cpuMw, gpuMw, aneMw, ramMw, thermalPressure
    def get_temps(self):    # cpuTempC, gpuTempC, ssdTempC
    def get_battery(self):  # percent, charging, cycles, timeLeft
    def get_machine(self):  # hostname, osVersion, model, uptime
    def get_devices(self):  # [{name, vendor, transport}]
    def get_top_cpu(self):  # [{name, pid, percent}]
    def get_top_mem(self):  # [{name, pid, memGB}]
```

### API

```
GET /api/system/cpu        → {percent, perCore[], freq, user, system, idle, physical, logical}
GET /api/system/memory     → {totalGB, usedGB, availableGB, freeGB, percent, swapTotalGB, swapUsedGB}
GET /api/system/gpu        → {name, utilization, vramMB, chip, tempC}
GET /api/system/network    → [{iface, ip, rxBytes, txBytes}]
GET /api/system/disk       → [{name, mount, totalGB, usedGB, freeGB, percent}]
GET /api/system/power      → {cpuMw, gpuMw, aneMw, thermalPressure}
GET /api/system/temps      → {cpuTempC, gpuTempC}
GET /api/system/battery    → {percent, charging, timeLeft, cycleCount}
GET /api/system/machine    → {hostname, osVersion, hwModel, uptime}
GET /api/system/devices    → [{name, vendor, transport}]
GET /api/system/top-cpu    → [{name, pid, percent}]
GET /api/system/top-mem    → [{name, pid, memGB}]
```

## iPad Widget 清单（11 个）

| # | Widget | 尺寸 | 类型 | API | 刷新 |
|---|--------|------|------|-----|------|
| 13 | CPU 监控 | 3×2 | `cpu-monitor` | `/cpu` | 1s |
| 14 | 内存监控 | 2×1 | `mem-monitor` | `/memory` | 2s |
| 15 | GPU 监控 | 2×1 | `gpu-monitor` | `/gpu` | 1s |
| 16 | 网络监控 | 3×1 | `net-monitor` | `/network` | 2s |
| 17 | 磁盘监控 | 3×2 | `disk-monitor` | `/disk` | 10s |
| 18 | 功耗监控 | 2×1 | `power-monitor` | `/power` | 2s |
| 19 | 电池监控 | 2×1 | `battery-monitor` | `/battery` | 5s |
| 20 | 机器信息 | 3×2 | `machine-info` | `/machine` | 60s |
| 21 | 外接设备 | 3×2 | `devices-info` | `/devices` | 60s |
| 22 | Top CPU | 4×3 | `top-cpu` | `/top-cpu` | 2s |
| 23 | Top Mem | 4×3 | `top-mem` | `/top-mem` | 2s |

## 实施说明

Plan B 作为 Plan A 的扩展，共用 Phase 0 建立的架构基础设施（Profile 类型系统、iPad 常驻区域、Widget Library 分组）。监测类 Widget 在 Widget Library 中归入 "📊 System Monitor" 分组。

实施优先级：Phase 0 → Plan A(Phase 1-6) → Plan B(Phase 7)
