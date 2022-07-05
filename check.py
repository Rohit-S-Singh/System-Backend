{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 2,
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "777\n"
     ]
    }
   ],
   "source": [
    "# import xlsxwriter module\n",
    "import xlsxwriter\n",
    " \n",
    "# Workbook() takes one, non-optional, argument\n",
    "# which is the filename that we want to create.\n",
    "workbook = xlsxwriter.Workbook('hello.xlsx')\n",
    " \n",
    "# The workbook object is then used to add new\n",
    "# worksheet via the add_worksheet() method.\n",
    "worksheet = workbook.add_worksheet()\n",
    " \n",
    "# Use the worksheet object to write\n",
    "# data via the write() method.\n",
    "worksheet.write('A1', 'Hello..')\n",
    "worksheet.write('B1', 'Geeks')\n",
    "worksheet.write('C1', 'For')\n",
    "worksheet.write('D1', 'Geeks')\n",
    " \n",
    "# Finally, close the Excel file\n",
    "# via the close() method.\n",
    "workbook.close()\n",
    "print('777')"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {},
   "outputs": [],
   "source": []
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.5"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}
