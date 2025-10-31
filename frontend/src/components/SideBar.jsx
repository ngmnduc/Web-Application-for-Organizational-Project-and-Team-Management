import React from 'react'

const SideBar = () => {
  return (
    <>
    <div className='w-64 bg-white border-r h-screen flex flex-col' >
        {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-8 border-b">
        <div className="bg-brand text-white font-bold text-lg w-8 h-8 flex items-center justify-center rounded"></div>
        <h1 className="font-semibold text-lg text-gray-700">USTH ERP</h1>
      </div>

    </div>
    </>
  )
}

export default SideBar