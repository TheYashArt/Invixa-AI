import { motion, AnimatePresence } from 'framer-motion'

export default function Profilemodel({setProfile, profile}) {
    return (
        <>
            <motion.div 
            className='fixed top-0 left-0 w-full h-full bg-black/40 bg-opacity-50 backdrop-blur-sm z-40 flex justify-center items-center'>
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                    onClick={()=>{setProfile(!profile)}}
                    className=" cursor-pointer fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-lg z-50 backdrop-blur-3xl ">
                    Close
                </motion.div>
            </motion.div>
        </>
    )
}