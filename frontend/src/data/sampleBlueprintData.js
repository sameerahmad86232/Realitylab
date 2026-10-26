export const sampleBlueprintData = {
  id: "bp-rl-9482",
  objectName: "AeroScan Mini-Quadcopter Drone",
  modelCode: "RL-4X-V2",
  category: "Autonomous Micro-Robotics / Mechatronics",
  detectedCategory: "Unmanned Aerial Vehicle (UAV)",
  confidence: 98.4,
  dimensions: "145 × 145 × 38 mm",
  estimatedWeight: "84.2 g",
  powerRating: "3.7V DC / 1.4A Peak",
  difficulty: "Intermediate",
  estimatedBuildTime: "2.5 Hours",
  summary: "Compact coaxial multirotor quadcopter chassis utilizing micro-coreless DC propulsion and optical flow spatial stabilization.",

  // Observed parts (directly detected by computer vision from user photos)
  observedParts: [
    {
      id: "obs-1",
      tag: "EXT-01",
      name: "Polycarbonate Airframe Chassis",
      category: "Structural",
      confidence: 99.1,
      specs: "High-impact injection-molded PC, unibody X-frame configuration",
      location: "Central frame & 4 cantilevered motor arms",
      visualCue: "Matte dark grey cross-strut architecture with stress relief ribs",
    },
    {
      id: "obs-2",
      tag: "EXT-02",
      name: "75mm Tri-Blade Propeller Array (x4)",
      category: "Propulsion",
      confidence: 98.7,
      specs: "Clockwise (CW) & Counter-Clockwise (CCW) paired polycarbonate blades",
      location: "Outer arm motor shafts",
      visualCue: "Curved aerodynamic airfoil profiles with friction-fit 1.0mm hubs",
    },
    {
      id: "obs-3",
      tag: "EXT-03",
      name: "Forward Stereo Optical Lens Module",
      category: "Sensory",
      confidence: 97.5,
      specs: "Dual 2.8mm focal length wide-angle lenses for depth estimation",
      location: "Nose cone housing",
      visualCue: "Glossy dual aperture bezel with anti-reflective glass coating",
    },
    {
      id: "obs-4",
      tag: "EXT-04",
      name: "USB-C Telemetry & Charging Port",
      category: "I/O Interface",
      confidence: 96.8,
      specs: "24-pin reversible surface-mount receptacle, 5V/1A charging capability",
      location: "Aft underside assembly",
      visualCue: "Metallic recessed rectangular port aligned with chassis seam",
    },
    {
      id: "obs-5",
      tag: "EXT-05",
      name: "High-Intensity Navigation LED Indicators (x4)",
      category: "Signaling",
      confidence: 98.2,
      specs: "SMD 0805 LEDs (Front: Cool White 6500K / Rear: Red 630nm)",
      location: "Under-motor landing peg assemblies",
      visualCue: "Translucent silicone diffuser caps on arm undersides",
    }
  ],

  // Inferred internal parts (deduced by spatial AI logic & electromechanical knowledge)
  inferredParts: [
    {
      id: "inf-1",
      tag: "INT-01",
      name: "8520 Coreless Brushed Micro-Motors (x4)",
      category: "Actuation",
      confidence: 95.4,
      inferenceReason: "Deduced from propeller diameter (75mm), chassis thrust requirement (120g total) and absence of brushless ESC commutation coils.",
      specs: "8.5mm diameter × 20mm length, 85,000 RPM @ 3.7V, NdFeB neodymium magnets",
      internalLocation: "Hollow vertical cylindrical sockets within arm endpoints",
    },
    {
      id: "inf-2",
      tag: "INT-02",
      name: "6-Axis MEMS Inertial Measurement Unit (IMU)",
      category: "Flight Control",
      confidence: 97.2,
      inferenceReason: "Required for autonomous pitch/roll attitude stabilization in multirotor physics.",
      specs: "3-axis gyroscope (±2000°/s) + 3-axis accelerometer (±16g), I2C bus",
      internalLocation: "Center-of-gravity isolated dampening pad on main board",
    },
    {
      id: "inf-3",
      tag: "INT-03",
      name: "Micro 4-Channel MOSFET Speed Controller (ESC)",
      category: "Power Electronics",
      confidence: 94.8,
      inferenceReason: "Coreless brushed motors require PWM pulse switching MOSFETs rated up to 4.5A per branch.",
      specs: "Dual N-channel ultra-low RDS(on) MOSFET array, 32kHz PWM frequency",
      internalLocation: "Lower PCB power copper pour region",
    },
    {
      id: "inf-4",
      tag: "INT-04",
      name: "1S 3.7V 380mAh High-Discharge LiPo Cell",
      category: "Energy Storage",
      confidence: 96.1,
      inferenceReason: "Standard volumetric energy density envelope based on internal cavity measurements (42 × 20 × 8mm).",
      specs: "25C continuous discharge rate, integrated overcharge/under-voltage protection IC",
      internalLocation: "Slide-in belly tray with rear retention clip",
    },
    {
      id: "inf-5",
      tag: "INT-05",
      name: "2.4GHz RF Ceramic Antenna & Microcontroller",
      category: "Compute & Comm",
      confidence: 93.9,
      inferenceReason: "Wireless command reception requires GHz frequency transceivers; surface area fits a ceramic dielectric chip antenna.",
      specs: "ARM Cortex-M0+ 48MHz core with integrated 2.4GHz GFSK transceiver",
      internalLocation: "Upper PCB RF shield enclosure",
    }
  ],

  // Build Mode: Household and maker materials
  householdMaterials: [
    {
      id: "mat-1",
      name: "Structural Airframe",
      standardSpec: "Injection-molded Polycarbonate (PC)",
      householdAlternative: "Rigid corrugated cardboard (cross-grain laminate) or 3D-printed PLA/PETG",
      estimatedCost: "$1.20 or Upcycled",
      source: "Upcycled Amazon shipping box or 20g 3D filament",
      difficulty: "Easy"
    },
    {
      id: "mat-2",
      name: "4x Micro Propulsion Motors",
      standardSpec: "8520 Coreless DC Motors (85k RPM)",
      householdAlternative: "Vibration motors harvested from old gaming gamepads or retired mini toy drones",
      estimatedCost: "$4.50 or Recycled",
      source: "Broken PS4/Xbox controller or surplus electronics",
      difficulty: "Moderate"
    },
    {
      id: "mat-3",
      name: "4x Aerodynamic Rotors",
      standardSpec: "75mm Tri-Blade Polycarbonate Propellers",
      householdAlternative: "Cut and twisted sections from clear plastic PET soda bottles",
      estimatedCost: "$0.00 (Upcycled)",
      source: "Recycled 2-liter PET drink bottle",
      difficulty: "Intermediate"
    },
    {
      id: "mat-4",
      name: "Battery Power Pack",
      standardSpec: "3.7V 380mAh 25C Li-Po Battery",
      householdAlternative: "Single rechargeable lithium cell from a retired Bluetooth earbud or vape device (with caution)",
      estimatedCost: "$3.00 or Recycled",
      source: "Repurposed single-cell gadget battery",
      difficulty: "Advanced"
    },
    {
      id: "mat-5",
      name: "Wiring & Interconnects",
      standardSpec: "30 AWG Silicone Stranded Wire",
      householdAlternative: "Disassembled internal wire strands from a severed USB-A cable",
      estimatedCost: "$0.00 (Junk drawer)",
      source: "Old charging cables",
      difficulty: "Easy"
    }
  ],

  // Build Mode: Step by step assembly instructions
  buildSteps: [
    {
      step: 1,
      title: "Chassis Fabrication & Symmetry Layout",
      duration: "30 mins",
      tools: ["Precision Craft Knife / Box Cutter", "Ruler or Calipers", "Cardboard / 3D Printer"],
      description: "Cut two identical X-shaped structural brackets from rigid corrugated board or print the generated STL. Ensure the diagonal center-to-motor distances measure precisely 102mm for aerodynamic center-of-thrust balance.",
      tip: "Glue the two layers with perpendicular grain orientation to prevent torsional flex during throttle bursts.",
      safetyWarning: null
    },
    {
      step: 2,
      title: "Motor Seat Mounting & Orthogonal Alignment",
      duration: "25 mins",
      tools: ["Hot Glue Gun or Epoxy", "Toothpick applicator"],
      description: "Press-fit the 4 coreless DC motors into the arm terminal sleeves. The drive shafts must stand exactly 90 degrees perpendicular to the airframe plane. Pair diagonals: Top-Left & Bottom-Right must rotate CW, Top-Right & Bottom-Left must rotate CCW.",
      tip: "Check spin direction before permanent bonding by momentarily touching leads to a 1.5V AA test battery.",
      safetyWarning: null
    },
    {
      step: 3,
      title: "Propulsion Rotor Shaping & Balancing",
      duration: "35 mins",
      tools: ["Scissors", "Small Needle / 1.0mm Drill Bit", "Lighter / Heat source"],
      description: "Slice four 75mm curved blades from the shoulder contour of a PET plastic bottle. Pierce the exact rotational center using a heated needle. Verify dynamic balance by spinning the rotor freely on a sewing needle before mounting to the motor shafts.",
      tip: "Imbalanced blades will produce high-frequency vibrations that confuse the IMU gyroscope.",
      safetyWarning: "Use caution when heating piercing needles over an open flame."
    },
    {
      step: 4,
      title: "Power Distribution & Wiring Harness",
      duration: "30 mins",
      tools: ["Soldering Iron", "Lead-free Solder", "Electrical Tape or Heatshrink"],
      description: "Route the positive (Red) and negative (Black) motor leads along the chassis underbelly toward the central compute plate. Solder each pair to the corresponding ESC MOSFET drain pads, insulating all exposed bare copper.",
      tip: "Twist motor lead pairs tightly around each other to cancel electromagnetic interference near the optical sensor.",
      safetyWarning: "Never short circuit positive and negative leads of a lithium battery."
    },
    {
      step: 5,
      title: "Sensor Calibration & Tethered Ground Test",
      duration: "20 mins",
      tools: ["USB Cable", "Safety Glasses", "Weights or Tape for bench anchoring"],
      description: "Anchor the drone chassis loosely to a flat bench using a 50cm thread tether. Connect the diagnostic USB port to run the 6-axis gyro zero-rate offset calibration. Gradually apply throttle to confirm uniform lift and attitude auto-leveling.",
      tip: "If the drone spins in yaw, swap the diagonal motor wiring pairs.",
      safetyWarning: "Always wear safety glasses during initial powered rotor tests."
    }
  ]
};

