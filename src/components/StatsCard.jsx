import { motion } from 'framer-motion';

export default function StatsCard({ icon: Icon, label, value, color, index = 0 }) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
  };

  const cls = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`bg-gradient-to-br ${cls} border backdrop-blur-md rounded-xl p-4 flex items-center gap-4`}
    >
      <div className={`w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${cls.split(' ').find(c => c.startsWith('text-'))}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-white/50 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}
